// Netlify Function: menu-data
// Serves and persists menu data via GitHub REST API
// 
// GET  /.netlify/functions/menu-data  → Returns latest menu.json from GitHub
// POST /.netlify/functions/menu-data  → Updates menu.json in GitHub
//
// Environment variables required:
//   GITHUB_TOKEN   - GitHub personal access token with repo scope
//   GITHUB_REPO    - Repository path: "owner/repo-name"
//   GITHUB_BRANCH  - Branch to commit to (e.g., "main")
//   ADMIN_SECRET   - Secret key for write operations (prevent unauthorized writes)

const GITHUB_API = 'https://api.github.com';

function respond(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...extraHeaders,
    },
  });
}

function respondGET(data) {
  return respond(200, data, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
}

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const secret = process.env.ADMIN_SECRET;

  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO environment variables');
  }
  return { token, repo, branch, secret };
}

// Fetch menu.json from GitHub
async function fetchFromGitHub({ token, repo, branch }) {
  const url = `${GITHUB_API}/repos/${repo}/contents/menu.json?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'elshaday-menu-function',
    },
  });

  if (res.status === 404) {
    return { exists: false, content: null, sha: null };
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub fetch failed: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  return { exists: true, content: JSON.parse(decoded), sha: data.sha };
}

// Write menu.json to GitHub
async function writeToGitHub({ token, repo, branch }, content, sha) {
  const url = `${GITHUB_API}/repos/${repo}/contents/menu.json`;
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

  const body = {
    message: 'Update menu data [automated]',
    content: encoded,
    branch,
    sha,
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'elshaday-menu-function',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write failed: ${res.status} - ${err}`);
  }

  return await res.json();
}

// Basic validation of menu data
function validateMenuData(data) {
  if (!Array.isArray(data)) return false;
  for (const item of data) {
    if (!item.id || !item.name || typeof item.price !== 'number') return false;
    if (!item.category || !['breakfast', 'lunch', 'drinks'].includes(item.category)) return false;
  }
  return true;
}

export default async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return respond(204, {});
  }

  try {
    const config = getConfig();

    if (req.method === 'GET') {
      const result = await fetchFromGitHub(config);
      if (!result.exists) {
        return respond(404, { error: 'menu.json not found in repository. Save from admin dashboard to create it.' });
      }
      return respondGET(result.content);
    }

    if (req.method === 'POST') {
      // Verify admin secret
      const authHeader = req.headers.get('authorization') || '';
      if (config.secret && authHeader !== `Bearer ${config.secret}`) {
        return respond(401, { error: 'Unauthorized. Invalid admin secret.' });
      }

      const body = await req.json();
      
      if (!validateMenuData(body)) {
        return respond(400, { error: 'Invalid menu data structure.' });
      }

      // Fetch current file to get SHA
      const current = await fetchFromGitHub(config);

      await writeToGitHub(config, body, current.sha);
      
      return respond(200, { success: true, message: 'Menu updated successfully. Changes propagate immediately.' });
    }

    return respond(405, { error: 'Method not allowed. Use GET or POST.' });
  } catch (err) {
    console.error('Function error:', err.message);
    return respond(500, { error: err.message || 'Internal server error' });
  }
};
