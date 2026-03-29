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

```
// Accepte deux formats :
// 1. { prompt: "..." } — format Chef OS
// 2. { model, messages, ... } — format Anthropic direct
let anthropicBody;

if (body.prompt) {
  // Format Chef OS — on construit le body Anthropic
  anthropicBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [{ role: 'user', content: body.prompt }]
  };
} else if (body.messages) {
  // Format Anthropic direct — on passe tel quel
  anthropicBody = body;
} else {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Format invalide — prompt ou messages requis' })
  };
}

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify(anthropicBody)
});

const data = await response.json();

return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(data)
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
