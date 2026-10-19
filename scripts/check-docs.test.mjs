import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { checkDocs } from './check-docs.mjs';

const TODAY = new Date(Date.UTC(2026, 8, 25));
const roots = [];
after(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));

function frontmatter(status = 'draft', lastVerified = '2026-09-01') {
  return `---\nstatus: ${status}\nlast-verified: ${lastVerified}\n---\n`;
}

function repoWith(files) {
  const root = mkdtempSync(join(tmpdir(), 'check-docs-'));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

function minimalRepo(extra = {}) {
  return repoWith({
    'AGENTS.md': '# Map\n[Style](docs/STYLE.md)\n',
    'docs/STYLE.md': `${frontmatter()}# Style\n`,
    ...extra,
  });
}

test('passes a repo whose docs are linked and carry frontmatter', () => {
  assert.deepEqual(checkDocs(minimalRepo(), TODAY), { errors: [], warnings: [] });
});

test('reports a link to a missing file', () => {
  const root = minimalRepo({ 'docs/STYLE.md': `${frontmatter()}See [gone](GONE.md).\n` });
  assert.deepEqual(checkDocs(root, TODAY).errors, ['docs/STYLE.md: broken link to GONE.md']);
});

test('ignores links inside code', () => {
  const root = minimalRepo({ 'docs/STYLE.md': `${frontmatter()}\`[a](a.md)\`\n\n\`\`\`md\n[b](b.md)\n\`\`\`\n` });
  assert.deepEqual(checkDocs(root, TODAY).errors, []);
});

test('reports a doc nothing links to', () => {
  const root = minimalRepo({ 'docs/ORPHAN.md': `${frontmatter()}# Orphan\n` });
  assert.deepEqual(checkDocs(root, TODAY).errors, [
    'docs/ORPHAN.md: not linked from AGENTS.md or any doc it links to; add it to the map or a related doc',
  ]);
});

test('reports missing and invalid frontmatter', () => {
  const missing = minimalRepo({ 'docs/STYLE.md': '# Style\n' });
  const invalid = minimalRepo({ 'docs/STYLE.md': `${frontmatter('done', 'soon')}# Style\n` });
  assert.deepEqual(checkDocs(missing, TODAY).errors, [
    'docs/STYLE.md: missing frontmatter; start the file with status (stub, draft or verified) and last-verified',
  ]);
  assert.deepEqual(checkDocs(invalid, TODAY).errors, [
    'docs/STYLE.md: status must be one of stub, draft, verified',
    'docs/STYLE.md: last-verified must be a YYYY-MM-DD date',
  ]);
});

test('accepts a date one day ahead of UTC, and reports one further ahead', () => {
  const tomorrow = minimalRepo({ 'docs/STYLE.md': `${frontmatter('draft', '2026-09-26')}# Style\n` });
  const later = minimalRepo({ 'docs/STYLE.md': `${frontmatter('draft', '2026-09-27')}# Style\n` });
  assert.deepEqual(checkDocs(tomorrow, TODAY).errors, []);
  assert.deepEqual(checkDocs(later, TODAY).errors, [
    "docs/STYLE.md: last-verified is in the future; use today's UTC date",
  ]);
});

test('warns about a verified doc not re-checked for over 90 days', () => {
  const stale = minimalRepo({ 'docs/STYLE.md': `${frontmatter('verified', '2026-06-01')}# Style\n` });
  const staleDraft = minimalRepo({ 'docs/STYLE.md': `${frontmatter('draft', '2026-06-01')}# Style\n` });
  assert.deepEqual(checkDocs(stale, TODAY), {
    errors: [],
    warnings: ['docs/STYLE.md: verified 116 days ago; re-check it against the code'],
  });
  assert.deepEqual(checkDocs(staleDraft, TODAY).warnings, []);
});

test('reports an AGENTS.md longer than 100 lines', () => {
  const root = minimalRepo({ 'AGENTS.md': `[Style](docs/STYLE.md)\n${'line\n'.repeat(100)}` });
  assert.deepEqual(checkDocs(root, TODAY).errors, [
    'AGENTS.md: 101 lines, the limit is 100; move detail into docs/ and link it',
  ]);
});

test('reports an index that misses a doc or disagrees on its status', () => {
  const root = repoWith({
    'AGENTS.md': '[Design](docs/design-docs/index.md)\n',
    'docs/design-docs/index.md': `${frontmatter()}| Doc | Status |\n|---|---|\n| [A](a.md) | verified |\n[B](b.md)\n`,
    'docs/design-docs/a.md': `${frontmatter('draft')}# A\n`,
    'docs/design-docs/b.md': `${frontmatter('draft')}# B\n`,
  });
  assert.deepEqual(checkDocs(root, TODAY).errors, [
    'docs/design-docs/index.md: status for docs/design-docs/a.md is "verified", the doc says "draft"',
    'docs/design-docs/index.md: no row for docs/design-docs/b.md',
  ]);
});

test('reports exec plans missing their required sections', () => {
  const root = minimalRepo({
    'docs/exec-plans/active/2026-09-25-setup.md': '# Setup\n## Purpose\n## Progress\n',
    'docs/exec-plans/completed/2026-09-01-init.md': '# Init\n## Purpose\n## Progress\n## Decision log\n',
  });
  assert.deepEqual(checkDocs(root, TODAY).errors, [
    'docs/exec-plans/active/2026-09-25-setup.md: missing sections: Decision log',
    'docs/exec-plans/completed/2026-09-01-init.md: missing sections: Outcome',
  ]);
});

test('checks links in agent config and changelogs but needs no frontmatter there', () => {
  const root = minimalRepo({
    'README.md': '# Readme\n',
    'docs/CHANGELOG-archive.md': '# Older releases\n',
    '.github/RELEASE_PROCESS.md': '[Map](../AGENTS.md)\n',
    '.claude/skills/plan/SKILL.md': '---\nname: plan\n---\n[Gone](../../../docs/GONE.md)\n',
  });
  assert.deepEqual(checkDocs(root, TODAY).errors, [
    '.claude/skills/plan/SKILL.md: broken link to ../../../docs/GONE.md',
  ]);
});

test('passes when every npm run command in the docs names a script in package.json', () => {
  const root = minimalRepo({
    'package.json': JSON.stringify({ scripts: { verify: 'x', 'check:files': 'x' } }),
    'docs/STYLE.md': `${frontmatter()}Run \`npm run verify\`, \`npm run -s verify\` or npm run verify.\n\`\`\`bash\nnpm run check:files -- --staged\n\`\`\`\nAdd a script with \`npm run <name>\`.\n`,
  });
  assert.deepEqual(checkDocs(root, TODAY).errors, []);
});

test('reports an npm run command whose script is not in package.json', () => {
  const root = minimalRepo({
    'package.json': JSON.stringify({ scripts: { verify: 'x' } }),
    'AGENTS.md': '# Map\n[Style](docs/STYLE.md)\n| Lint | `npm run lint` |\n',
    'docs/STYLE.md': `${frontmatter()}\`\`\`bash\nnpm run verify && npm run typecheck\n\`\`\`\n`,
  });
  const fix = 'fix the command, or add the script to package.json';
  assert.deepEqual(checkDocs(root, TODAY).errors, [
    `AGENTS.md:3: \`npm run lint\` names no script in package.json; ${fix}`,
    `docs/STYLE.md:6: \`npm run typecheck\` names no script in package.json; ${fix}`,
  ]);
});

test('skips generated docs, local data and notes, and agent worktrees', () => {
  const root = minimalRepo({
    'docs/generated/db-schema.md': '# Schema\n',
    'docs/scratch/notes.md': '[x](missing.md)\n',
    'docs/plans/old.md': '[x](missing.md)\n',
    'data/notes.md': '[x](missing.md)\n',
    '.claude/worktrees/copy/AGENTS.md': '[x](missing.md)\n',
  });
  assert.deepEqual(checkDocs(root, TODAY), { errors: [], warnings: [] });
});
