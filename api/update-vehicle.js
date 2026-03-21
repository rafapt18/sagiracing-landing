export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const PASS = process.env.ADMIN_PASS || 'Sagiracing2026#';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'rafapt18/sagiracing-landing';
  const FILE_PATH = 'public/sold.json';

  // GET - return current sold list
  if (req.method === 'GET') {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
      });
      const data = await r.json();
      const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
      return res.status(200).json(content);
    } catch (e) {
      return res.status(200).json({ sold: [] });
    }
  }

  // POST - update sold list
  if (req.method === 'POST') {
    const { password, vehicleId, action } = req.body;
    if (password !== PASS) return res.status(401).json({ error: 'Password incorreta' });
    if (!vehicleId) return res.status(400).json({ error: 'vehicleId obrigatório' });

    try {
      // Get current file
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
      });
      const fileData = await r.json();
      const current = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
      const sha = fileData.sha;

      // Update sold list
      if (action === 'sell') {
        if (!current.sold.includes(vehicleId)) current.sold.push(vehicleId);
      } else if (action === 'unsell') {
        current.sold = current.sold.filter(id => id !== vehicleId);
      }

      // Commit to GitHub
      const updated = Buffer.from(JSON.stringify(current, null, 2)).toString('base64');
      const commitRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${action === 'sell' ? 'Marcar vendido' : 'Repor'}: ${vehicleId}`,
          content: updated,
          sha: sha
        })
      });

      if (commitRes.ok) {
        return res.status(200).json({ success: true, sold: current.sold });
      } else {
        const err = await commitRes.json();
        return res.status(500).json({ error: err.message });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
