exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    let anthropicBody;
    
    if (body.prompt) {
      anthropicBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: body.prompt }]
      };
    } else if (body.messages) {
      anthropicBody = { ...body, model: 'claude-sonnet-4-20250514' };
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Format invalide' })
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
    
    // Extraire et valider le JSON directement ici
    if (data.content && data.content[0] && data.content[0].text) {
      const text = data.content[0].text;
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const jsonStr = text.slice(start, end + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          // Renvoyer directement l'objet parsé
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              content: [{ type: 'text', text: JSON.stringify(parsed) }]
            })
          };
        } catch(e) {
          // Si parsing échoue, renvoyer le texte brut nettoyé
          const cleaned = text
            .replace(/[\u0000-\u001F\u007F]/g, ' ')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
          data.content[0].text = cleaned;
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
