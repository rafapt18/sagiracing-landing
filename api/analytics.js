const https = require('https');
const REPO = 'rafapt18/sagiracing-landing';
const FILE_PATH = 'public/analytics.json';
const GH_TOKEN = process.env.GITHUB_TOKEN;

function ghApi(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'api.github.com',
      path: '/repos/' + REPO + path,
      method,
      headers: {
        'Authorization': 'token ' + GH_TOKEN,
        'User-Agent': 'sagiracing-analytics',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve(d); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getAnalytics() {
  try {
    const file = await ghApi('GET', '/contents/' + FILE_PATH);
    if (file.content) {
      return JSON.parse(Buffer.from(file.content, 'base64').toString());
    }
  } catch {}
  return { pageviews: {}, views: {}, clicks: {}, contacts: {} };
}

async function saveAnalytics(data) {
  const file = await ghApi('GET', '/contents/' + FILE_PATH).catch(() => null);
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = {
    message: 'Update analytics ' + new Date().toISOString().slice(0, 10),
    content,
    ...(file && file.sha ? { sha: file.sha } : {})
  };
  return ghApi('PUT', '/contents/' + FILE_PATH, body);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const analytics = await getAnalytics();
    return res.json(analytics);
  }

  if (req.method === 'POST') {
    const { event, data } = req.body || {};
    if (!event) return res.status(400).json({ error: 'Missing event' });

    const analytics = await getAnalytics();
    const today = new Date().toISOString().slice(0, 10);

    // Pageviews per day
    if (event === 'PageView') {
      if (!analytics.pageviews) analytics.pageviews = {};
      analytics.pageviews[today] = (analytics.pageviews[today] || 0) + 1;
    }

    // Car views (scrolled into view)
    if (event === 'ViewContent' && data?.content_name) {
      if (!analytics.views) analytics.views = {};
      if (!analytics.views[today]) analytics.views[today] = {};
      analytics.views[today][data.content_name] = (analytics.views[today][data.content_name] || 0) + 1;
    }

    // Contact clicks
    if (event === 'Contact') {
      if (!analytics.contacts) analytics.contacts = {};
      if (!analytics.contacts[today]) analytics.contacts[today] = { whatsapp: 0, messenger: 0, phone: 0, by_car: {} };
      const cat = (data?.content_category || '').toLowerCase();
      if (cat.includes('whatsapp')) analytics.contacts[today].whatsapp++;
      if (cat.includes('messenger')) analytics.contacts[today].messenger++;
      if (cat.includes('phone')) analytics.contacts[today].phone++;
      if (data?.content_name) {
        analytics.contacts[today].by_car[data.content_name] = (analytics.contacts[today].by_car[data.content_name] || 0) + 1;
      }
    }

    // Keep only last 30 days
    for (const key of ['pageviews', 'views', 'contacts']) {
      if (analytics[key] && typeof analytics[key] === 'object') {
        const days = Object.keys(analytics[key]).sort();
        while (days.length > 30) delete analytics[key][days.shift()];
      }
    }

    await saveAnalytics(analytics);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
