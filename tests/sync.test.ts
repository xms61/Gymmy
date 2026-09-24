import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiCallFor,
  applyOps,
  classifyStatus,
  isAdoptionConfirmed,
  sendInOrder,
  sessionsToAdopt,
  type PendingOp,
  type SendResult,
  type Snapshot,
  withoutOps
} from '../src/services/sync.ts';
import { EXERCISE_DEFINITIONS } from '../src/data/seedData.ts';
import type { WorkoutSession } from '../src/types/workout.ts';

function session(id: string, date = '2026-09-20'): WorkoutSession {
  return {
    id,
    name: 'Pull',
    splitType: 'Pull',
    date,
    startTime: `${date}T17:00:00.000Z`,
    durationMinutes: 60,
    totalVolumeKg: 0,
    completed: true,
    exercises: []
  };
}

function serverSnapshot(...sessions: WorkoutSession[]): Snapshot {
  return { sessions, exercises: EXERCISE_DEFINITIONS };
}

function sessionIds(snapshot: Snapshot): string[] {
  return snapshot.sessions.map(s => s.id);
}

test('a session saved offline survives the next start', () => {
  const next = applyOps(serverSnapshot(session('old')), [{ type: 'upsertSession', session: session('offline') }]);
  assert.deepEqual(sessionIds(next), ['offline', 'old']);
});

test('a delete made offline is not undone by the server copy', () => {
  const next = applyOps(serverSnapshot(session('keep'), session('gone')), [{ type: 'deleteSession', id: 'gone' }]);
  assert.deepEqual(sessionIds(next), ['keep']);
});

test('saving a known session replaces it in place', () => {
  const edited = { ...session('b'), notes: 'edited' };
  const next = applyOps(serverSnapshot(session('a'), session('b'), session('c')), [{ type: 'upsertSession', session: edited }]);
  assert.deepEqual(sessionIds(next), ['a', 'b', 'c']);
  assert.equal(next.sessions[1]?.notes, 'edited');
});

test('clearing removes sessions and keeps exercises', () => {
  const next = applyOps(serverSnapshot(session('a')), [{ type: 'clearSessions' }]);
  assert.deepEqual(next, { sessions: [], exercises: EXERCISE_DEFINITIONS });
});

test('maps each operation to its API call', () => {
  const CASES: [op: PendingOp, expected: ReturnType<typeof apiCallFor>][] = [
    [{ type: 'upsertSession', session: session('s') }, { method: 'POST', path: '/api/sessions', body: session('s') }],
    [{ type: 'deleteSession', id: 'a b' }, { method: 'DELETE', path: '/api/sessions/a%20b' }],
    [{ type: 'saveExercises', exercises: EXERCISE_DEFINITIONS }, { method: 'POST', path: '/api/exercises', body: EXERCISE_DEFINITIONS }],
    [{ type: 'clearSessions' }, { method: 'POST', path: '/api/clear' }]
  ];
  for (const [op, expected] of CASES) {
    assert.deepEqual(apiCallFor(op), expected, op.type);
  }
});

test('treats only payload errors as permanent', () => {
  const CASES: [status: number, expected: SendResult][] = [
    [200, 'sent'],
    [400, 'rejected'],
    [413, 'rejected'],
    [415, 'rejected'],
    [403, 'failed'],
    [404, 'failed'],
    [500, 'failed']
  ];
  for (const [status, expected] of CASES) {
    assert.equal(classifyStatus(status), expected, String(status));
  }
});

test('operations are sent in order and stop at the first failure', async () => {
  const ops: PendingOp[] = [
    { type: 'deleteSession', id: '1' },
    { type: 'deleteSession', id: '2' },
    { type: 'deleteSession', id: '3' }
  ];
  const sent: PendingOp[] = [];
  const result = await sendInOrder(ops, async op => {
    sent.push(op);
    return sent.length === 2 ? 'failed' : 'sent';
  });
  assert.deepEqual(sent, ops.slice(0, 2));
  assert.deepEqual(result, { remaining: ops.slice(1), rejected: [] });
});

test('a rejected operation is set aside and the rest are still sent', async () => {
  const ops: PendingOp[] = [
    { type: 'deleteSession', id: 'bad' },
    { type: 'deleteSession', id: 'good' }
  ];
  const result = await sendInOrder(ops, async op => (op.type === 'deleteSession' && op.id === 'bad' ? 'rejected' : 'sent'));
  assert.deepEqual(result, { remaining: [], rejected: [ops[0]] });
});

test('sent operations leave the outbox even if it changed while they were in flight', () => {
  const sent: PendingOp[] = [{ type: 'upsertSession', session: session('a') }, { type: 'deleteSession', id: 'b' }];
  const addedMeanwhile: PendingOp = { type: 'upsertSession', session: session('c') };
  // Another tab's write replaced the outbox with copies read back from storage, plus its own op.
  const outbox = JSON.parse(JSON.stringify([...sent, addedMeanwhile])) as PendingOp[];
  assert.deepEqual(withoutOps(outbox, sent), [addedMeanwhile]);
});

test('an operation queued twice leaves the outbox once per send', () => {
  const save: PendingOp = { type: 'upsertSession', session: session('a') };
  assert.deepEqual(withoutOps([save, save], [save]), [save]);
});

test('an operation another tab already sent is not removed twice', () => {
  const clear: PendingOp = { type: 'clearSessions' };
  const other: PendingOp = { type: 'deleteSession', id: 'x' };
  assert.deepEqual(withoutOps([other], [clear]), [other]);
});

test('adopts only valid sessions that are not known yet', () => {
  const adoption = sessionsToAdopt([session('known'), session('new'), { id: 'broken' }], serverSnapshot(session('known')));
  assert.deepEqual(adoption.validIds, ['known', 'new']);
  assert.equal(adoption.invalidCount, 1);
  assert.deepEqual(adoption.toAdopt.map(s => s.id), ['new']);
});

test('confirms an adoption only when every session is stored and sent', () => {
  const adoption = sessionsToAdopt([session('a'), session('b')], serverSnapshot());
  const stored = serverSnapshot(session('a'), session('b'));
  const CASES: [label: string, stored: Snapshot, outbox: PendingOp[], expected: boolean][] = [
    ['stored and sent', stored, [], true],
    ['unrelated change still queued', stored, [{ type: 'deleteSession', id: 'x' }], true],
    ['still waiting for the server', stored, [{ type: 'upsertSession', session: session('b') }], false],
    ['missing from the stored copy', serverSnapshot(session('a')), [], false]
  ];
  for (const [label, storedCopy, outbox, expected] of CASES) {
    assert.equal(isAdoptionConfirmed(adoption, storedCopy, outbox), expected, label);
  }
});

test('never confirms an adoption that had invalid sessions', () => {
  const adoption = sessionsToAdopt([session('a'), 'not a session'], serverSnapshot());
  assert.equal(isAdoptionConfirmed(adoption, serverSnapshot(session('a')), []), false);
});
