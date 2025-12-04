// Vercel Serverless Function
// สร้างไฟล์นี้ที่: /api/line-proxy.js

// ดึง Access Token จาก Environment Variable
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, uid, message } = req.query;

  try {
    // Action: get-profile
    if (action === 'get-profile' && req.method === 'GET') {
      if (!uid) {
        return res.status(400).json({ error: 'UID is required' });
      }

      const response = await fetch(`https://api.line.me/v2/bot/profile/${uid}`, {
        headers: {
          'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: 'Failed to fetch profile',
          details: errorText 
        });
      }

      const profile = await response.json();
      return res.status(200).json({ success: true, profile });
    }

    // Action: send-message
    if (action === 'send-message' && req.method === 'POST') {
      const body = req.body;
      
      if (!body.to || !body.message) {
        return res.status(400).json({ error: 'Missing required fields: to, message' });
      }

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: body.to,
          messages: [{ type: 'text', text: body.message }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: 'Failed to send message',
          details: errorText 
        });
      }

      return res.status(200).json({ success: true });
    }

    // Invalid action
    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
