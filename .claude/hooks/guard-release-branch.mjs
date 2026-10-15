#!/usr/bin/env node
// PreToolUse guard for the branch your pipelines deploy from.
//
// A deploy branch is usually protected by nothing but convention, so the workspace rule is that an agent
// never moves, pushes, deletes or deploys it without the user's approval (see CLAUDE.md). This hook is
// that rule's backstop: it reads each Bash and PowerShell command before it runs and, when the command
// would write the guarded branch, answers "ask" so the user gets an approval prompt. It never answers
// "deny" — an approved action still runs — and it stays silent for everything else, reads included.
//
// It reads command text, so it is a tripwire for honest mistakes rather than a sandbox: a script that
// pushes on the agent's behalf is invisible to it.
//
// It may also be registered in ~/.claude/settings.json with `--user`, so sessions started elsewhere on
// the machine (a repository opened directly, a worktree outside the workspace) are covered too. Inside
// the workspace the `--user` run stands down so nothing prompts twice.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// ─── CONFIGURATION ──────────────────────────────────────────────────────────────────────────────────
// This file is owned by the workspace template and is replaced wholesale when the template updates.
// Do NOT edit it to configure a project — put your values in `.claude/guard.config.json`, which is
// yours and is never overwritten. `.claude/guard.config.example.json` is the starting point.
//
// ⚠ Until that file exists and its TODO values are replaced, this hook cannot check anything — so it
//   fails LOUD rather than silent: it asks for approval on every push, merge, rebase, reset --hard,
//   pipeline run and non-GET API call, and says why.

// This file lives in the workspace's .claude/hooks, whichever session runs it.
const WORKSPACE = path.resolve(import.meta.dirname, '..', '..');

const CONFIG = (() => {
  const defaults = { deployBranch: 'TODO-deploy-branch', guardedRepos: ['TODO-repo'], ciOrg: 'TODO-ci-org' };
  try {
    const raw = JSON.parse(readFileSync(path.join(WORKSPACE, '.claude', 'guard.config.json'), 'utf8'));
    return {
      deployBranch: typeof raw.deployBranch === 'string' && raw.deployBranch ? raw.deployBranch : defaults.deployBranch,
      guardedRepos:
        Array.isArray(raw.guardedRepos) && raw.guardedRepos.length ? raw.guardedRepos.filter(Boolean) : defaults.guardedRepos,
      ciOrg: typeof raw.ciOrg === 'string' && raw.ciOrg ? raw.ciOrg : defaults.ciOrg,
    };
  } catch {
    // Missing, unreadable or malformed config leaves the guard unconfigured, which fails loud below.
    return defaults;
  }
})();

const BRANCH = CONFIG.deployBranch;
const GUARDED_REPO_DIRS = CONFIG.guardedRepos;
const CI_ORG_NAME = CONFIG.ciOrg;
// ────────────────────────────────────────────────────────────────────────────────────────────────────

const REPO_ALT = GUARDED_REPO_DIRS.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// Matched against `git remote -v` output, so the trailing \s is part of the shape.
const GUARDED_REMOTE = new RegExp(`/(?:${REPO_ALT})(?:\\.git)?\\s`, 'i');
// Matched against a bare `owner/repo` argument or a URL path.
const GUARDED_REPO_NAME = new RegExp(`(?:${REPO_ALT})`, 'i');

// Where to look when a command's directory cannot be read from its text (`cd "$W"`).
const GUARDED_REPOS = GUARDED_REPO_DIRS.map((r) => path.join(WORKSPACE, 'Codebase', r));

const ADO_ORG = new RegExp(`dev\\.azure\\.com/${CI_ORG_NAME}|${CI_ORG_NAME}\\.visualstudio\\.com`, 'i');

const MENTION = new RegExp(`(^|[^\\w-])${BRANCH}(?![\\w-])`);
const LOCAL_REF = new RegExp(`^(refs/heads/|heads/)?${BRANCH}$`);
// A fetch/pull refspec whose destination is the local branch: `x:<branch>`, `+x:refs/heads/<branch>`.
const INTO_BRANCH = new RegExp(`^\\+?[^:]*:(refs/heads/)?${BRANCH}$`);
const BRANCH_CONFIG = new RegExp(`^branch\\.${BRANCH}\\.`, 'i');

const mentions = (text) => MENTION.test(text);
const isLocalRef = (text) => LOCAL_REF.test(text);

// Cheap pre-filter: every command this hook cares about runs one of these.
const RELEVANT = /\b(git|az|gh|curl|wget|invoke-restmethod|invoke-webrequest|irm|iwr)\b/i;

// True while any constant in the CONFIGURE block is still a placeholder.
const UNCONFIGURED = [BRANCH, CI_ORG_NAME, ...GUARDED_REPO_DIRS].some((v) => /^TODO-/.test(v));

// Branch-agnostic shapes this hook exists to catch, used ONLY while UNCONFIGURED. There is no branch
// name to match against then, so this keys on the verb alone and deliberately over-matches: a guard
// that is merely silent is worse than one that is briefly annoying. `git log --grep=merge` prompting
// is the intended cost, and filling in the block above ends it.
const DANGEROUS_SHAPE =
  /\b(?:push|merge|rebase|cherry-pick|update-ref)\b|--hard\b|\bbranch\b[^\n]*\s-(?:f|D)\b|\b(?:checkout|switch)\b[^\n]*\s-(?:B|C)\b|\bpipelines\b[^\n]*\brun\b|\bpr\b[^\n]*\b(?:merge|complete)\b|\brepos\b[^\n]*\b(?:ref|policy)\b|-X\s*["']?(?:POST|PUT|PATCH|DELETE)\b/i;

function ask(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: reason },
    }),
  );
}

function main() {
  if (process.argv.includes('--user') && coveredByWorkspace()) return;
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const command = input?.tool_input?.command;
  if (typeof command !== 'string' || !RELEVANT.test(command)) return;

  // An unconfigured guard protects nothing, and failing silent is exactly how that goes unnoticed.
  // Nothing below could judge anything anyway: BRANCH matches no real branch.
  if (UNCONFIGURED) {
    if (DANGEROUS_SHAPE.test(command)) {
      ask(
        'Branch guard is UNCONFIGURED, so this command is unchecked. Copy ' +
          '.claude/guard.config.example.json to .claude/guard.config.json and set deployBranch, ' +
          'guardedRepos and ciOrg (and the matching TODOs in CLAUDE.md). Until then every push, merge, ' +
          'reset and pipeline run asks like this one.',
      );
    }
    return;
  }

  const mode = input.tool_name === 'PowerShell' ? 'powershell' : 'bash';
  let reason;
  try {
    reason = inspect(command, mode, input.cwd || process.cwd(), 0);
  } catch (err) {
    // Fail closed only when the branch is named: an unrelated command must never start prompting.
    if (mentions(command)) reason = `the guard could not read this command (${err.message})`;
  }
  if (!reason) return;

  ask(
    `${BRANCH} guard: ${reason}. ${BRANCH} is the branch your pipelines deploy from; an agent may not ` +
      'change it without your approval (see CLAUDE.md).',
  );
}

/** Whether this session is in the workspace and the workspace's own settings run this hook. */
function coveredByWorkspace() {
  const project = process.env.CLAUDE_PROJECT_DIR;
  if (!project || path.resolve(project).toLowerCase() !== WORKSPACE.toLowerCase()) return false;
  try {
    // An unreadable or invalid settings file loads no hooks at all, so it covers nothing.
    const settings = JSON.parse(readFileSync(path.join(WORKSPACE, '.claude', 'settings.json'), 'utf8'));
    return JSON.stringify(settings.hooks?.PreToolUse ?? []).includes(path.basename(import.meta.filename));
  } catch {
    return false;
  }
}

// ─── Walking a command line ─────────────────────────────────────────────────────────────────────────

const CD = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl', 'push-location']);
const WRAPPERS = new Set(['command', 'exec', 'builtin', 'sudo', 'time', 'nohup', 'env', 'winpty']);
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

/** The reason `command` needs approval, or null. `dir` follows `cd` from one segment to the next. */
function inspect(command, mode, cwd, depth) {
  if (depth > 3) return null;
  let dir = cwd;
  for (const words of split(command, mode)) {
    for (const inner of substitutions(words, mode)) {
      const reason = inspect(inner, mode, dir, depth + 1);
      if (reason) return reason;
    }
    const argv = unwrap(words);
    if (argv.length === 0) continue;
    const name = program(argv[0]);
    const args = argv.slice(1);
    if (CD.has(name)) {
      dir = changeDir(dir, cdTarget(args));
      continue;
    }
    const reason = inspectProgram(name, args, dir, depth);
    if (reason) return reason;
  }
  return null;
}

function inspectProgram(name, args, dir, depth) {
  switch (name) {
    case 'git':
      return inspectGit(args, dir);
    case 'az':
      return inspectAz(args, dir);
    case 'gh':
      return inspectGh(args, dir);
    case 'curl':
    case 'wget':
    case 'invoke-restmethod':
    case 'invoke-webrequest':
    case 'irm':
    case 'iwr':
      return inspectHttp(args);
    case 'bash':
    case 'sh':
    case 'zsh':
      return nested(args, ['-c'], 'bash', dir, depth);
    case 'pwsh':
    case 'powershell':
      return nested(args, ['-command', '-c'], 'powershell', dir, depth);
    case 'cmd':
      return nested(args, ['/c', '/k'], 'powershell', dir, depth);
    case 'invoke-expression':
    case 'iex':
      return inspect(args.join(' '), 'powershell', dir, depth + 1);
    default:
      return null;
  }
}

function nested(args, flags, mode, dir, depth) {
  const i = args.findIndex((a) => flags.includes(a.toLowerCase()));
  return i < 0 ? null : inspect(args.slice(i + 1).join(' '), mode, dir, depth + 1);
}

function unwrap(words) {
  let i = 0;
  while (i < words.length && (ASSIGNMENT.test(words[i]) || WRAPPERS.has(words[i].toLowerCase()))) i++;
  return words.slice(i);
}

function program(word) {
  return path.win32.basename(word).toLowerCase().replace(/\.(exe|cmd|bat)$/, '');
}

function cdTarget(args) {
  for (let i = 0; i < args.length; i++) {
    if (/^-(path|literalpath)$/i.test(args[i])) return args[i + 1];
    if (args[i].startsWith('-') && args[i] !== '-') continue;
    return args[i];
  }
  return undefined;
}

/** The directory after `cd target`, or null when it cannot be known from the text. */
function changeDir(dir, target) {
  if (target === undefined) return homedir();
  const p = toNative(target);
  if (p === null) return null;
  if (path.isAbsolute(p)) return path.resolve(p);
  return dir ? path.resolve(dir, p) : null;
}

// Git Bash spells C:\x as /c/x. `$VAR`, `%VAR%` and `-` (the previous directory) cannot be resolved here.
function toNative(p) {
  if (/[$%`]/.test(p) || p === '-') return null;
  if (p === '~' || p.startsWith('~/') || p.startsWith('~\\')) p = path.join(homedir(), p.slice(1));
  const drive = /^\/([a-zA-Z])(\/|$)/.exec(p);
  return drive ? `${drive[1]}:/${p.slice(3)}` : p;
}

/**
 * Splits a command line into segments (at ; | & && || newlines and grouping) and each segment into words,
 * with quotes removed and redirections dropped. `$(...)` and bash backticks are kept whole inside their
 * word so `substitutions` can inspect them.
 */
function split(command, mode) {
  const segments = [];
  let words = [];
  let word = '';
  let inWord = false;
  let skipNext = false; // the next word is a redirection target
  const escape = mode === 'powershell' ? '`' : '\\';

  const endWord = () => {
    if (inWord) {
      if (skipNext) skipNext = false;
      else words.push(word);
    }
    word = '';
    inWord = false;
  };
  const endSegment = () => {
    endWord();
    if (words.length) segments.push(words);
    words = [];
  };
  const capture = (i) => {
    // `$(...)` or a bash backtick pair starting at i; returns the index of its last character.
    const end = command[i] === '`' ? command.indexOf('`', i + 1) : closing(command, i + 1);
    const stop = end < 0 ? command.length - 1 : end;
    word += command.slice(i, stop + 1);
    inWord = true;
    return stop;
  };

  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    const next = command[i + 1];

    if (c === escape) {
      if (next === '\n') i++;
      else if (next !== undefined) {
        word += next;
        inWord = true;
        i++;
      }
      continue;
    }
    if ((c === '$' && next === '(') || (c === '`' && mode === 'bash')) {
      i = capture(i);
      continue;
    }
    if (c === "'") {
      const end = command.indexOf("'", i + 1);
      const stop = end < 0 ? command.length : end;
      word += command.slice(i + 1, stop);
      inWord = true;
      i = stop;
      continue;
    }
    if (c === '"') {
      inWord = true;
      for (i++; i < command.length && command[i] !== '"'; i++) {
        const d = command[i];
        if (d === escape && (mode === 'powershell' || '$`"\\\n'.includes(command[i + 1]))) word += command[++i];
        else if ((d === '$' && command[i + 1] === '(') || (d === '`' && mode === 'bash')) i = capture(i);
        else word += d;
      }
      continue;
    }
    if (c === '#' && !inWord) {
      while (i + 1 < command.length && command[i + 1] !== '\n') i++;
      continue;
    }
    if (c === '>' || c === '<' || (c === '&' && next === '>')) {
      if (/^\d*$/.test(word)) {
        word = '';
        inWord = false;
      } else endWord();
      while ('<>&|'.includes(command[i + 1] ?? 'x')) i++;
      if (command[i] === '&' && /\d/.test(command[i + 1] ?? '')) {
        while (/\d/.test(command[i + 1] ?? '')) i++;
      } else skipNext = true;
      continue;
    }
    if (c === '\n' || c === ';' || c === '|' || c === '&' || c === ')' || (c === '(' && !inWord)) {
      endSegment();
      continue;
    }
    if ((c === '{' || c === '}') && !inWord && (next === undefined || /\s/.test(next))) {
      endSegment();
      continue;
    }
    if (/\s/.test(c)) {
      endWord();
      continue;
    }
    word += c;
    inWord = true;
  }
  endSegment();
  return segments;
}

/** Index of the `)` matching the `(` at `open`. */
function closing(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "'") {
      const e = s.indexOf("'", i + 1);
      if (e < 0) return s.length - 1;
      i = e;
    } else if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) return i;
  }
  return s.length - 1;
}

/** Commands inside `$(...)` and bash backticks, which run before the word they sit in. */
function substitutions(words, mode) {
  const found = [];
  for (const w of words) {
    for (let i = w.indexOf('$('); i >= 0; i = w.indexOf('$(', i + 2)) found.push(w.slice(i + 2, closing(w, i + 1)));
    if (mode === 'bash') for (const m of w.matchAll(/`([^`]*)`/g)) found.push(m[1]);
  }
  return found;
}

function positionals(args, valued = []) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      out.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('-') && a.length > 1) {
      if (valued.includes(a)) i++;
      continue;
    }
    out.push(a);
  }
  return out;
}

// ─── git ────────────────────────────────────────────────────────────────────────────────────────────

// Subcommands that move whatever branch is checked out.
const MOVES_CHECKED_OUT = new Set(['commit', 'merge', 'pull', 'reset', 'rebase', 'cherry-pick', 'revert', 'am']);
const BRANCH_FORCE = /^(--force|-[a-zA-Z]*f[a-zA-Z]*)$/;
const BRANCH_WRITE = /^(-[a-zA-Z]*[dDmMcCu][a-zA-Z]*|--delete|--move|--copy|--set-upstream-to(=.*)?|--unset-upstream|--edit-description)$/;
const CONFIG_READ = new Set(['--get', '--get-all', '--get-regexp', '--get-urlmatch', '-l', '--list', 'get', 'list']);

function inspectGit(args, dir) {
  let i = 0;
  for (; i < args.length && args[i].startsWith('-'); i++) {
    if (args[i] === '-C') dir = changeDir(dir, args[++i]);
    else if (['-c', '--git-dir', '--work-tree', '--namespace'].includes(args[i])) i++;
  }
  const sub = args[i];
  if (!sub) return null;
  const reason = gitWrite(sub, args.slice(i + 1), dir);
  return reason && isGuarded(dir) !== false ? reason : null;
}

function gitWrite(sub, rest, dir) {
  switch (sub) {
    case 'push':
      return pushWrite(rest, dir);
    case 'fetch':
    case 'pull':
      if (rest.some((a) => INTO_BRANCH.test(a))) return `git ${sub} writes into ${BRANCH} through a refspec`;
      break;
    case 'branch': {
      const reason = branchWrite(rest, dir);
      if (reason) return reason;
      break;
    }
    case 'update-ref':
    case 'symbolic-ref':
      if (rest.some(mentions)) return `git ${sub} rewrites ${BRANCH}`;
      break;
    case 'checkout':
    case 'switch':
      if (createsBranch(rest, ['-b', '-B', '-c', '-C', '--create', '--force-create', '--orphan'])) {
        return `git ${sub} creates or resets ${BRANCH}`;
      }
      break;
    case 'worktree':
      if (rest[0] === 'add' && createsBranch(rest.slice(1), ['-b', '-B'])) return `git worktree add creates or resets ${BRANCH}`;
      break;
    case 'rebase': {
      // `git rebase <upstream> <branch>` checks <branch> out first and rewrites it.
      const p = positionals(rest, ['--onto', '-s', '--strategy', '-X', '--strategy-option', '-x', '--exec']);
      if (p.length >= 2 && isLocalRef(p[p.length - 1])) return `git rebase rewrites ${BRANCH}`;
      break;
    }
    case 'config':
      if (rest.some((a) => BRANCH_CONFIG.test(a)) && !rest.some((a) => CONFIG_READ.has(a))) {
        return `git config changes ${BRANCH}'s upstream or settings`;
      }
      break;
  }
  if (MOVES_CHECKED_OUT.has(sub) && onBranch(dir)) return `git ${sub} with ${BRANCH} checked out moves it`;
  return null;
}

function pushWrite(rest, dir) {
  if (rest.some(mentions)) return `git push names ${BRANCH}`;
  if (rest.some((a) => ['--all', '--branches', '--mirror'].includes(a))) return `git push ${rest.find((a) => a.startsWith('--'))} includes ${BRANCH}`;
  const refspecs = positionals(rest, ['-o', '--push-option', '--repo', '--receive-pack', '--exec']).slice(1);
  const pushesCheckedOut = refspecs.length === 0 || refspecs.some((r) => /^\+?(HEAD|@)(:|$)/.test(r));
  if (pushesCheckedOut && onBranch(dir)) return `git push from a checkout of ${BRANCH} pushes it`;
  return null;
}

function branchWrite(rest, dir) {
  const p = positionals(rest, ['-u', '--set-upstream-to', '--format', '--sort', '--contains', '--no-contains', '--merged', '--no-merged', '--points-at']);
  // Delete, rename, copy or retarget: of the guarded branch by name, or of the checked-out branch when none is named.
  if (rest.some((a) => BRANCH_WRITE.test(a)) && (p.some(isLocalRef) || (p.length <= 1 && onBranch(dir)))) {
    return `git branch deletes, renames, copies or retargets ${BRANCH}`;
  }
  // `-f <name> <start>` moves <name>; the guarded branch as the start point is only read.
  if (rest.some((a) => BRANCH_FORCE.test(a)) && isLocalRef(p[0] ?? '')) return `git branch -f moves ${BRANCH}`;
  return null;
}

function createsBranch(rest, flags) {
  return rest.some(
    (a, i) =>
      (flags.includes(a) && isLocalRef(rest[i + 1] ?? '')) ||
      (a.length > 2 && !a.startsWith('--') && flags.includes(a.slice(0, 2)) && isLocalRef(a.slice(2))),
  );
}

const guardedCache = new Map();

/** true for a checkout of a guarded repository, false for any other directory, null if unknown. */
function isGuarded(dir) {
  if (!dir) return null;
  if (!guardedCache.has(dir)) {
    const remotes = git(dir, ['remote', '-v']);
    // Not a repository at all: the git command will fail on its own.
    guardedCache.set(dir, remotes === null ? false : GUARDED_REMOTE.test(remotes));
  }
  return guardedCache.get(dir);
}

/** Whether `dir` has the guarded branch checked out. With no readable directory: whether any guarded worktree has. */
function onBranch(dir) {
  if (dir && existsSync(dir)) {
    const head = git(dir, ['symbolic-ref', '-q', 'HEAD']);
    return head !== null && head.trim() === `refs/heads/${BRANCH}`;
  }
  const checkedOut = new RegExp(`^branch refs/heads/${BRANCH}$`, 'm');
  return GUARDED_REPOS.some((repo) => {
    if (!existsSync(repo)) return false;
    const list = git(repo, ['worktree', 'list', '--porcelain']);
    return list === null || checkedOut.test(list);
  });
}

function git(dir, args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
      windowsHide: true,
    });
  } catch {
    return null;
  }
}

// ─── Pipelines, pull requests and the REST APIs behind them ─────────────────────────────────────────

const ADO_WRITE_API = /pipeline|build|git|polic|release|distributedtask|approval|check/i;

function inspectAz(args, dir) {
  const lower = args.map((a) => a.toLowerCase());
  const [group, cmd, verb] = lower;
  const value = (...flags) => {
    const i = lower.findIndex((a) => flags.includes(a));
    return i >= 0 ? (args[i + 1] ?? '') : undefined;
  };

  if (group === 'rest') return httpWrite(value('--method', '-m') ?? 'GET', value('--url', '--uri', '-u') ?? '');
  if (!inGuardedOrg(value('--org', '--organization'), dir)) return null;

  if (group === 'pipelines' && (cmd === 'run' || (cmd === 'build' && verb === 'queue'))) {
    const branch = value('--branch');
    if (branch === undefined || mentions(branch)) return `az pipelines ${cmd} queues a run on ${BRANCH} or the pipeline's default branch`;
  }
  if (group === 'repos' && (cmd === 'ref' || cmd === 'policy')) {
    if (args.some(mentions) && lower.some((a) => ['create', 'update', 'delete', 'lock', 'unlock'].includes(a))) {
      return `az repos ${cmd} changes ${BRANCH}`;
    }
  }
  if (group === 'repos' && cmd === 'pr' && (verb === 'update' || verb === 'create')) {
    const completes = (value('--status') ?? '').toLowerCase() === 'completed' || /^(true|yes|on)$/i.test(value('--auto-complete') ?? '');
    const target = value('--target-branch', '-t');
    if (completes && (verb === 'update' || target === undefined || mentions(target))) return `az repos pr ${verb} completes a pull request`;
  }
  if (group === 'devops' && cmd === 'invoke') {
    const method = (value('--http-method') ?? 'GET').toUpperCase();
    const api = `${value('--area') ?? ''} ${value('--resource') ?? ''}`;
    if (method !== 'GET' && ADO_WRITE_API.test(api)) return `a ${method} to the Azure DevOps "${api.trim()}" API can queue, approve or merge`;
  }
  return null;
}

/** Whether an az devops command reaches the guarded org: named by --org, or inferred from the directory's git remote. */
function inGuardedOrg(org, dir) {
  if (org !== undefined) return ADO_ORG.test(org) || new RegExp(`^${CI_ORG_NAME}$`, 'i').test(org);
  if (!dir) return true;
  const remotes = git(dir, ['remote', '-v']);
  // Outside a repository az has no organization to infer, and the command fails on its own.
  return remotes !== null && ADO_ORG.test(remotes);
}

function inspectGh(args, dir) {
  if (args[0] === 'pr' && args[1] === 'merge') {
    const i = args.findIndex((a) => a === '-R' || a === '--repo');
    const inScope = i >= 0 ? GUARDED_REPO_NAME.test(args[i + 1] ?? '') : isGuarded(dir) !== false;
    return inScope ? 'gh pr merge merges a pull request' : null;
  }
  if (args[0] !== 'api') return null;
  const i = args.findIndex((a) => a === '-X' || a === '--method');
  const method = i >= 0 ? args[i + 1] : args.some((a) => /^(-f|-F|--field|--raw-field|--input)$/.test(a)) ? 'POST' : 'GET';
  const endpoint = positionals(args.slice(1), ['-X', '--method', '-H', '--header', '-f', '-F', '--field', '--raw-field', '-q', '--jq', '-t', '--template', '--input', '-p', '--preview'])[0] ?? '';
  return httpWrite(method, `https://api.github.com/${endpoint.replace(/^\//, '')}`);
}

function inspectHttp(args) {
  const i = args.findIndex((a) => a === '-X' || a === '--request' || /^-method$/i.test(a));
  let method = i >= 0 ? args[i + 1] : undefined;
  if (!method && args.some((a) => /^(-d|-F|-T|--data.*|--form|--json|--upload-file|-[Bb]ody)$/.test(a))) method = 'POST';
  return httpWrite(method ?? 'GET', args.find((a) => /^https?:\/\//i.test(a)) ?? '');
}

function httpWrite(method, url) {
  if (/^(get|head)$/i.test(method ?? 'GET')) return null;
  if (ADO_ORG.test(url) && /_apis\/(pipelines|build|git|policy|release|distributedtask)/i.test(url)) {
    return `a ${method} to the Azure DevOps API can queue, approve or merge`;
  }
  if (new RegExp(`api\\.github\\.com/repos/[^/]+/(?:${REPO_ALT})`, 'i').test(url) && (mentions(url) || /\/(merges|merge|git\/refs)\b/i.test(url))) {
    return `a ${method} to the GitHub API can merge or move a branch`;
  }
  return null;
}

// Last, so every constant above is initialised before it runs.
main();
