// Netlify Function: reviews
// Persists customer reviews via GitHub (reviews.json)

const GITHUB_API = 'https://api.github.com';

function respond(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
  if (!token || !repo) throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO');
  return { token, repo, branch, secret };
}

async function fetchReviewsFile({ token, repo, branch }) {
  const url = `${GITHUB_API}/repos/${repo}/contents/reviews.json?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'elshaday-reviews-function',
    },
  });
  if (res.status === 404) return { exists: false, content: [], sha: null };
  if (!res.ok) { const err = await res.text(); throw new Error(`GitHub fetch failed: ${res.status} - ${err}`); }
  const data = await res.json();
  const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  return { exists: true, content: JSON.parse(decoded), sha: data.sha };
}

async function writeReviewsFile({ token, repo, branch }, content, sha) {
  const url = `${GITHUB_API}/repos/${repo}/contents/reviews.json`;
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'elshaday-reviews-function',
    },
    body: JSON.stringify({
      message: 'Update reviews [automated]',
      content: encoded,
      branch,
      sha: sha || undefined,
    }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`GitHub write failed: ${res.status} - ${err}`); }
  return await res.json();
}

export default async (req) => {
  if (req.method === 'OPTIONS') return respond(204, {});

  try {
    const config = getConfig();

    if (req.method === 'GET') {
      const result = await fetchReviewsFile(config);
      return respondGET(result.content || []);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      if (!body.id || !body.itemId || !body.author || !body.comment) {
        return respond(400, { error: 'Missing required fields: id, itemId, author, comment' });
      }
      const current = await fetchReviewsFile(config);
      const reviews = current.content || [];
      reviews.unshift(body);
      await writeReviewsFile(config, reviews, current.sha);
      return respond(200, { success: true, message: 'Review added.' });
    }

    if (req.method === 'DELETE') {
      const authHeader = req.headers.get('authorization') || '';
      if (config.secret && authHeader !== `Bearer ${config.secret}`) {
        return respond(401, { error: 'Unauthorized.' });
      }
      const { id } = await req.json();
      if (!id) return respond(400, { error: 'Missing review id' });
      const current = await fetchReviewsFile(config);
      const reviews = (current.content || []).filter((r) => r.id !== id);
      await writeReviewsFile(config, reviews, current.sha);
      return respond(200, { success: true, message: 'Review deleted.' });
    }

    return respond(405, { error: 'Method not allowed.' });
  } catch (err) {
    console.error('Reviews function error:', err.message);
    return respond(500, { error: err.message });
  }
};
