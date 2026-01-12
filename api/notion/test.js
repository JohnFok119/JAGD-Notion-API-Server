/**
 * Vercel Serverless Function - Test Notion Connection
 * Endpoint: /api/notion/test
 */

const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!process.env.NOTION_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'NOTION_API_KEY not configured',
      });
    }

    // Initialize Notion client
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    // Test connection by getting bot info
    const botInfo = await notion.users.me();

    res.status(200).json({
      success: true,
      message: 'Successfully connected to Notion workspace!',
      data: {
        botName: botInfo.name || 'Integration',
        type: botInfo.type,
        workspaceAccess: 'Connected',
      },
    });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`,
    });
  }
};

