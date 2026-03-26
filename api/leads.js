const https = require('https');
const REPO = 'rafapt18/sagiracing-landing';
const FILE_PATH = 'public/leads.json';
const GH_TOKEN = process.env.GITHUB_TOKEN;
const PASS = process.env.ADMIN_PASS || 'Sagiracing2026#';

function ghApi(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'api.github.com',
      path: '/repos/' + REPO + path,
      method,
      headers: {
        'Authorization': 'token ' + GH_TOKEN,
        'User-Agent': 'sagiracing-leads',
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

async function getLeads() {
  try {
    const file = await ghApi('GET', '/contents/' + FILE_PATH);
    if (file.content) {
      return JSON.parse(Buffer.from(file.content, 'base64').toString());
    }
  } catch {}
  return { leads: [] };
}

async function saveLeads(data) {
  const file = await ghApi('GET', '/contents/' + FILE_PATH).catch(() => null);
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = {
    message: 'New lead ' + new Date().toISOString().slice(0, 16),
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
    const { password } = req.query || {};
    if (password !== PASS) return res.status(401).json({ error: 'Unauthorized' });
    const data = await getLeads();
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { name, phone, email, vehicle } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone obrigatórios' });

    const data = await getLeads();
    data.leads.push({
      name,
      phone,
      email: email || '',
      vehicle: vehicle || '',
      date: new Date().toISOString(),
      status: 'novo'
    });

    // Keep last 200 leads
    if (data.leads.length > 200) data.leads = data.leads.slice(-200);

    await saveLeads(data);
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
