const BASE = 'https://api.github.com';

const ALLOWED_EXTENSIONS = new Set([
  'json', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif',
  'md', 'txt', 'csv', 'yml', 'yaml', 'toml',
  'ico', 'woff', 'woff2', 'ttf', 'otf', 'eot',
])

const PROTECTED_BRANCHES = new Set(['main', 'master', 'production', 'prod', 'live', 'deploy'])

interface GitHubBranch {
  name: string
  commit: { sha: string; commit: { committer: { date: string } | null } }
}

interface GitHubPR {
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  head: { ref: string }
  base: { ref: string }
}

interface GitHubContent { sha: string; content: string; encoding: string }
interface GitHubRef { object: { sha: string } }
interface GitHubCompare { ahead_by: number }

function headers(token: string) {
  return { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
}

async function api(url: string, token: string, opts: RequestInit = {}) {
  const res = await fetch(url, { ...opts, headers: { ...headers(token), ...(opts.headers as Record<string,string>) } });
  if (!res.ok) {
    let msg = `GitHub API error: ${res.status}`;
    try {
      const d = await res.json() as { message?: string; errors?: { message?: string; resource?: string; field?: string; code?: string }[] };
      msg = d.message || msg;
      if (d.errors && Array.isArray(d.errors)) {
        const details = d.errors.map(e =>
          `${e.resource || ''}${e.field ? '.' + e.field : ''}: ${e.message || e.code || ''}`
        ).filter(Boolean).join('; ');
        if (details) msg += ' (' + details + ')';
      }
    } catch {}
    throw new Error(msg);
  }
  return res.status !== 204 ? res.json() : null;
}

export function assertNotProtectedBranch(branch: string) {
  if (PROTECTED_BRANCHES.has(branch)) {
    throw new Error(`Blocked: cannot commit directly to "${branch}". All changes must go through a feature branch + PR.`)
  }
}

export function assertAllowedPath(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Blocked: cannot commit "${path}" — file type ".${ext}" is not allowed. Only content files (JSON, images, SVGs, markdown) may be modified.`)
  }
  const forbiddenDirs = ['src/components/', 'src/utils/', 'src/store', 'src/App.', 'src/main.', 'src/vite-env']
  for (const dir of forbiddenDirs) {
    if (path.startsWith(dir)) {
      throw new Error(`Blocked: cannot commit "${path}" — this directory contains source code. Only content files under src/mission/, src/announcements/, src/info/ may be modified.`)
    }
  }
}

export async function testToken(token: string, owner?: string, repo?: string) {
  try {
    await api(BASE + '/user', token);
    return true;
  } catch {
    if (owner && repo) {
      try {
        await api(`${BASE}/repos/${owner}/${repo}`, token);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}


export async function getFile(token: string, owner: string, repo: string, path: string, branch: string) {
  try {
    const data = await api(`${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, token) as GitHubContent;
    return { sha: data.sha, content: atob(data.content.replace(/\n/g, '')), exists: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('404') || msg.includes('Not Found')) return { sha: null, content: null, exists: false };
    throw e;
  }
}

/** Quick fetch just the SHA of a file on a given branch. Returns null if the file doesn't exist. */
export async function getFileSha(token: string, owner: string, repo: string, path: string, branch: string): Promise<string | null> {
  try {
    const data = await api(`${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, token) as GitHubContent;
    return data.sha;
  } catch {
    return null;
  }
}

/** Compare two branches — returns how many commits ahead the head is. */
export async function getCommitAhead(token: string, owner: string, repo: string, base: string, head: string): Promise<number> {
  try {
    const data = await api(`${BASE}/repos/${owner}/${repo}/compare/${base}...${head}`, token) as GitHubCompare;
    return data.ahead_by;
  } catch {
    return 0;
  }
}

async function putFile(token: string, owner: string, repo: string, path: string, content: string, message: string, branch: string, sha?: string | null) {
  assertNotProtectedBranch(branch)
  assertAllowedPath(path)
  const body: Record<string,unknown> = { message, content: btoa(unescape(encodeURIComponent(content))), branch };
  if (sha) body.sha = sha;
  await api(`${BASE}/repos/${owner}/${repo}/contents/${path}`, token, { method: 'PUT', body: JSON.stringify(body) });
}

export async function createBranch(token: string, owner: string, repo: string, baseBranch: string, newBranch: string) {
  assertNotProtectedBranch(newBranch)
  const base = await api(`${BASE}/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`, token) as GitHubRef;
  await api(`${BASE}/repos/${owner}/${repo}/git/refs`, token, {
    method: 'POST',
    body: JSON.stringify({ ref: 'refs/heads/' + newBranch, sha: base.object.sha })
  });
}

export async function commitFile(token: string, owner: string, repo: string, path: string, content: string, message: string, branch: string, sha?: string | null) {
  await putFile(token, owner, repo, path, content, message, branch, sha);
}

export async function commitBinary(token: string, owner: string, repo: string, path: string, base64: string, message: string, branch: string, sha?: string | null) {
  assertNotProtectedBranch(branch)
  assertAllowedPath(path)
  const body: Record<string,unknown> = { message, content: base64, branch };
  if (sha) body.sha = sha;
  await api(`${BASE}/repos/${owner}/${repo}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export interface BranchInfo {
  name: string
  sha: string
  updated: string
}

export interface PRInfo {
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  head: { ref: string }
  base: { ref: string }
}

export async function listBranches(token: string, owner: string, repo: string): Promise<BranchInfo[]> {
  const data = await api(`${BASE}/repos/${owner}/${repo}/branches?per_page=100`, token) as GitHubBranch[]
  return data.map(b => ({
    name: b.name,
    sha: b.commit.sha,
    updated: b.commit.commit?.committer?.date || '',
  }))
}

export async function listAdminBranches(token: string, owner: string, repo: string): Promise<BranchInfo[]> {
  const all = await listBranches(token, owner, repo)
  return all.filter(b => b.name.startsWith('admin-update'))
}

export async function listPRs(token: string, owner: string, repo: string, state: string = 'all'): Promise<PRInfo[]> {
  const data = await api(`${BASE}/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`, token) as GitHubPR[]
  return data.map(p => ({
    number: p.number,
    title: p.title,
    state: p.state,
    html_url: p.html_url,
    created_at: p.created_at,
    head: { ref: p.head.ref },
    base: { ref: p.base.ref },
  }))
}

export async function getNextBranchName(token: string, owner: string, repo: string): Promise<string> {
  try {
    const branches = await listAdminBranches(token, owner, repo)
    let maxNum = 0
    for (const b of branches) {
      const match = b.name.match(/^admin-update-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return 'admin-update-' + String(maxNum + 1).padStart(4, '0')
  } catch {
    return 'admin-update-' + Date.now().toString(36)
  }
}

export interface BranchStatus {
  name: string
  sha: string
  updated: string
  state: 'active' | 'merged' | 'stale' | 'duplicate'
  prNumber?: number
  prUrl?: string
  daysOld: number
}

export async function analyzeBranches(token: string, owner: string, repo: string, baseBranch: string): Promise<BranchStatus[]> {
  const [branches, prs] = await Promise.all([
    listAdminBranches(token, owner, repo),
    listPRs(token, owner, repo, 'all'),
  ])

  const mergedBranchNames = new Set<string>()
  for (const pr of prs) {
    if (pr.state === 'merged' || pr.state === 'closed') {
      mergedBranchNames.add(pr.head.ref)
    }
  }

  const now = Date.now()
  const STALE_DAYS = 30

  return branches.map(b => {
    const daysOld = Math.floor((now - new Date(b.updated || Date.now()).getTime()) / 86400000)
    const pr = prs.find(p => p.head.ref === b.name)

    if (pr && (pr.state === 'merged' || pr.state === 'closed')) {
      return { ...b, state: 'merged' as const, prNumber: pr.number, prUrl: pr.html_url, daysOld }
    }
    if (daysOld > STALE_DAYS) {
      return { ...b, state: 'stale' as const, daysOld }
    }
    if (pr && pr.state === 'open') {
      return { ...b, state: 'active' as const, prNumber: pr.number, prUrl: pr.html_url, daysOld }
    }
    return { ...b, state: 'active' as const, daysOld }
  })
}

export function assertAdminBranch(branch: string) {
  if (!branch.startsWith('admin-update-')) {
    throw new Error(`Blocked: cannot modify "${branch}" — only admin-update-* branches can be managed from this panel.`)
  }
}

export async function deleteBranch(token: string, owner: string, repo: string, branch: string) {
  assertNotProtectedBranch(branch)
  assertAdminBranch(branch)
  await api(`${BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, { method: 'DELETE' })
}

export interface CleanupResult {
  deleted: string[]
  kept: string[]
  errors: { name: string; error: string }[]
}

export async function cleanupStaleBranches(token: string, owner: string, repo: string, baseBranch: string): Promise<CleanupResult> {
  const result: CleanupResult = { deleted: [], kept: [], errors: [] }
  const branches = await analyzeBranches(token, owner, repo, baseBranch)

  for (const b of branches) {
    if (b.state === 'merged') {
      try {
        await deleteBranch(token, owner, repo, b.name)
        result.deleted.push(b.name)
      } catch (e) {
        result.errors.push({ name: b.name, error: e instanceof Error ? e.message : 'Unknown' })
      }
    } else {
      result.kept.push(b.name)
    }
  }
  return result
}

export async function createPR(token: string, owner: string, repo: string, title: string, body: string, head: string, base: string) {
  const data = await api(`${BASE}/repos/${owner}/${repo}/pulls`, token, {
    method: 'POST',
    body: JSON.stringify({
      title: title.trim(),
      body: body.replace(/\0/g, '').trim(),
      head: owner + ':' + head,
      base,
      maintainer_can_modify: true,
    })
  }) as { html_url: string; number: number };
  return { url: data.html_url, number: data.number };
}

export async function updatePR(token: string, owner: string, repo: string, prNumber: number, title: string, body: string) {
  await api(`${BASE}/repos/${owner}/${repo}/pulls/${prNumber}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      title: title.trim(),
      body: body.replace(/\0/g, '').trim(),
    })
  });
}

export async function branchExists(token: string, owner: string, repo: string, branch: string): Promise<boolean> {
  try {
    await api(`${BASE}/repos/${owner}/${repo}/branches/${branch}`, token);
    return true;
  } catch {
    return false;
  }
}

export async function resetBranch(token: string, owner: string, repo: string, branch: string, targetBranch: string) {
  assertNotProtectedBranch(branch)
  assertAdminBranch(branch)
  const target = await api(`${BASE}/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token) as GitHubRef;
  await api(`${BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ sha: target.object.sha, force: true }),
  });
}
