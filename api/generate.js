cat > ~/Downloads/api-generate-fix.js << 'EOF'
const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const body = req.body || {};
  
  // Accepte { prompt } ou { messages }
  let postData;
  if (body.prompt) {
    postData = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: body.prompt }]
    });
  } else if (body.messages) {
    postData = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: body.messages
    });
  } else {
    res.status(400).json({ error: 'Prompt manquant' });
    return;
  }

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    const data = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch(e) { reject(new Error('Parse error: ' + body.slice(0, 100))); }
        });
      });
      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    const text = (data.content || []).filter(i => i.type === 'text').map(i => i.text).join('');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) { res.status(500).json({ error: 'Aucun JSON', raw: text.slice(0,200) }); return; }
    const parsed = JSON.parse(text.slice(start, end + 1));
    res.status(200).json({ parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
EOF
echo "OK"
