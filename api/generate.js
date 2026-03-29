exports.handler = async function(event) {
if (event.httpMethod === ‘OPTIONS’) {
return {
statusCode: 200,
headers: {
‘Access-Control-Allow-Origin’: ‘*’,
‘Access-Control-Allow-Headers’: ‘Content-Type’,
‘Access-Control-Allow-Methods’: ‘POST, OPTIONS’
},
body: ‘’
};
}

if (event.httpMethod !== ‘POST’) {
return { statusCode: 405, body: ‘Method Not Allowed’ };
}

try {
const body = JSON.parse(event.body || ‘{}’);
const prompt = body.prompt || ‘’;

```
if (!prompt) {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Prompt manquant' })
  };
}

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }]
  })
});

const data = await response.json();
const text = (data.content || []).filter(i => i.type === 'text').map(i => i.text).join('');

// Parse JSON on server side - avoid client-side issues
const start = text.indexOf('{');
const end = text.lastIndexOf('}');

if (start === -1 || end === -1) {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Aucun JSON dans la reponse' })
  };
}

const jsonStr = text.slice(start, end + 1);
const parsed = JSON.parse(jsonStr);

// Return pre-parsed object directly
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({ parsed: parsed })
};
```

} catch (error) {
return {
statusCode: 500,
headers: { ‘Content-Type’: ‘application/json’, ‘Access-Control-Allow-Origin’: ‘*’ },
body: JSON.stringify({ error: error.message })
};
}
};
