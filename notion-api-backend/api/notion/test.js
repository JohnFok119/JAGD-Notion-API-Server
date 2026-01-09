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
    const DATABASE_ID = process.env.VITE_NOTION_DATABASE_ID;

    if (!DATABASE_ID) {
      return res.status(500).json({
        success: false,
        message: 'Database ID not configured',
      });
    }

    // Initialize Notion client
    const notion = new Client({
      auth: process.env.VITE_NOTION_API_KEY,
    });

    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    res.status(200).json({
      success: true,
      message: `Successfully connected! Found ${response.results.length} items in database.`,
      count: response.results.length,
    });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`,
    });
  }
};

