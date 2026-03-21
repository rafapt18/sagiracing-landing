export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const PASS = 'Sagiracing2026#';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'rafapt18/sagiracing-landing';
  const FILE_PATH = 'public/sold.json';

  async function getFile() {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
    });
    const data = await r.json();
    return {
      content: JSON.parse(Buffer.from(data.content, 'base64').toString()),
      sha: data.sha
    };
  }

  async function saveFile(content, message, sha) {
    const updated = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: updated, sha })
    });
    return r.ok;
  }

  // GET - return current data
  if (req.method === 'GET') {
    try {
      const { content } = await getFile();
      return res.status(200).json(content);
    } catch {
      return res.status(200).json({ sold: [], edits: {}, deleted: [] });
    }
  }

  // POST
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { password, vehicleId, action, edits } = body;
    if (password !== PASS) return res.status(401).json({ error: 'Password incorreta: ' + typeof password });

    try {
      const { content: current, sha } = await getFile();
      if (!current.sold) current.sold = [];
      if (!current.edits) current.edits = {};
      if (!current.deleted) current.deleted = [];

      let msg = '';

      if (action === 'sell') {
        if (!current.sold.includes(vehicleId)) current.sold.push(vehicleId);
        msg = `Vendido: ${vehicleId}`;
      } else if (action === 'unsell') {
        current.sold = current.sold.filter(id => id !== vehicleId);
        msg = `Repor: ${vehicleId}`;
      } else if (action === 'edit' && vehicleId && edits) {
        current.edits[vehicleId] = { ...(current.edits[vehicleId] || {}), ...edits };
        msg = `Editar: ${vehicleId}`;
      } else if (action === 'delete') {
        if (!current.deleted.includes(vehicleId)) current.deleted.push(vehicleId);
        current.sold = current.sold.filter(id => id !== vehicleId);
        msg = `Eliminar: ${vehicleId}`;
      } else if (action === 'undelete') {
        current.deleted = current.deleted.filter(id => id !== vehicleId);
        msg = `Restaurar: ${vehicleId}`;
      }

      const ok = await saveFile(current, msg, sha);
      if (ok) {
        return res.status(200).json({ success: true, ...current });
      }
      return res.status(500).json({ error: 'Erro ao guardar' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
