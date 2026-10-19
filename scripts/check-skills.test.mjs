import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import { skillProblems } from './check-skills.mjs';

const roots = [];
after(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));

function repoWith(files) {
  const root = mkdtempSync(join(tmpdir(), 'check-skills-'));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

function skill(fields, body = '# Skill\n') {
  return `---\n${fields}\n---\n\n${body}`;
}

test("passes on this repo's own skills", () => {
  assert.deepEqual(skillProblems(join(dirname(fileURLToPath(import.meta.url)), '..')), []);
});

test('passes when there is no skills folder', () => {
  assert.deepEqual(skillProblems(repoWith({ 'AGENTS.md': '# Map\n' })), []);
});

test('passes on valid skills: quoted, folded, CRLF, and user-invoked', () => {
  const root = repoWith({
    '.claude/skills/plan/SKILL.md': skill('name: plan\ndescription: "Plan work. Use when: starting."'),
    '.claude/skills/garden/SKILL.md': skill('name: garden\ndescription: >\n  Tend the docs.\n  Use before a release.'),
    '.claude/skills/fix-bugs/SKILL.md': '---\r\nname: fix-bugs\r\ndescription: Fix bugs.\r\n---\r\n',
    '.claude/skills/retro/SKILL.md': skill('name: retro\ndescription: Run a retro.\ndisable-model-invocation: true'),
    '.claude/skills/README.md': 'Not a skill; ignored.\n',
  });
  assert.deepEqual(skillProblems(root), []);
});

test('passes on valid YAML: comments after values, a byte-order mark, trailing spaces on the --- lines', () => {
  const root = repoWith({
    '.claude/skills/retro/SKILL.md': skill(
      'name: retro # the folder name\ndescription: "Run a retro." # quoted\ndisable-model-invocation: true # ask only',
    ),
    '.claude/skills/plan/SKILL.md': '﻿--- \nname: plan\ndescription: Plan work#not-a-comment.\n---  \n',
  });
  assert.deepEqual(skillProblems(root), []);
});

test('reports a skill folder without SKILL.md', () => {
  const root = repoWith({ '.claude/skills/plan/skill.md': skill('name: plan\ndescription: Plan.') });
  assert.deepEqual(skillProblems(root), [
    '.claude/skills/plan: no SKILL.md (the name is case-sensitive); add one, or delete the folder',
  ]);
});

test('reports a missing or unclosed frontmatter block', () => {
  const root = repoWith({
    '.claude/skills/plan/SKILL.md': '# Plan\n',
    '.claude/skills/garden/SKILL.md': '---\nname: garden\ndescription: Tend.\n',
  });
  const fix = 'start the file with a --- line, name and description, and a closing --- line';
  assert.deepEqual(skillProblems(root), [
    `.claude/skills/garden/SKILL.md: no frontmatter; ${fix}`,
    `.claude/skills/plan/SKILL.md: no frontmatter; ${fix}`,
  ]);
});

test('reports a missing name, a name unlike its folder, and a malformed name', () => {
  const root = repoWith({
    '.claude/skills/a/SKILL.md': skill('description: A.'),
    '.claude/skills/b/SKILL.md': skill('name: plan\ndescription: B.'),
    '.claude/skills/Bad--Name/SKILL.md': skill('name: Bad--Name\ndescription: C.'),
  });
  assert.deepEqual(skillProblems(root), [
    '.claude/skills/Bad--Name/SKILL.md: name "Bad--Name" must be lowercase letters, digits and single hyphens, at most 64 characters, and start and end with a letter or digit',
    '.claude/skills/a/SKILL.md: no name; set it to the folder name, "a"',
    '.claude/skills/b/SKILL.md: name "plan" doesn\'t match its folder "b"; agents find a skill by its folder, so rename one to match',
  ]);
});

test('reports a missing, empty, null, comment-only or overlong description', () => {
  const root = repoWith({
    '.claude/skills/a/SKILL.md': skill('name: a'),
    '.claude/skills/b/SKILL.md': skill('name: b\ndescription: ""'),
    '.claude/skills/c/SKILL.md': skill(`name: c\ndescription: ${'x'.repeat(1025)}`),
    '.claude/skills/d/SKILL.md': skill('name: d\ndescription: ~'),
    '.claude/skills/e/SKILL.md': skill('name: e\ndescription: # todo'),
  });
  const missing = 'no description; agents decide when to load a skill from it, so say what it does and when to use it';
  assert.deepEqual(skillProblems(root), [
    `.claude/skills/a/SKILL.md: ${missing}`,
    `.claude/skills/b/SKILL.md: ${missing}`,
    '.claude/skills/c/SKILL.md: description is 1025 characters, the limit is 1024; move the detail into the body',
    `.claude/skills/d/SKILL.md: ${missing}`,
    `.claude/skills/e/SKILL.md: ${missing}`,
  ]);
});

test('reports a disable-model-invocation that is not true or false', () => {
  const root = repoWith({ '.claude/skills/a/SKILL.md': skill('name: a\ndescription: A.\ndisable-model-invocation: yes') });
  assert.deepEqual(skillProblems(root), [
    '.claude/skills/a/SKILL.md: disable-model-invocation must be true or false, not "yes"',
  ]);
});
