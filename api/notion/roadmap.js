/**
 * Vercel Serverless Function - Fetch Roadmap Data
 * Endpoint: /api/notion/roadmap
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
    const { projectSlug } = req.query;

    const DATABASE_MAP = {
      'CodeLens': process.env.NOTION_CODELENS_DATABASE_ID,
      // Add more projectSlug to DATABASE_ID mappings here
    };

    const DATABASE_ID = DATABASE_MAP[projectSlug];

    if (!DATABASE_ID) {
      return res.status(400).json({
        success: false,
        error: `Database ID not configured for projectSlug: ${projectSlug}`,
      });
    }

    // Initialize Notion client
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    const queryOptions = {
      database_id: DATABASE_ID,
    };


    const response = await notion.databases.query(queryOptions);

    console.log(`📊 Fetched ${response.results.length} items from Notion`);

    // Group items by phase
    const phasesMap = {};

    response.results.forEach((page) => {
      const props = page.properties;
      
      const phaseName = props['Phase Name']?.rich_text?.[0]?.plain_text || '';
      const phase = props.Phase?.select?.name || '';
      const date = props.Date?.rich_text?.[0]?.plain_text || '';
      
      // Get raw status from Notion (handle both Status and Select property types)
      const rawStatus = props.Status?.status?.name || props.Status?.select?.name || 'Not Started';
      const notionStatus = rawStatus.toLowerCase().trim();
      
      // Map Notion status to our format
      let status;
      if (notionStatus.includes('progress') || notionStatus.includes('in progress')) {
        status = 'in-progress';
      } else if (notionStatus.includes('completed') || notionStatus.includes('complete')) {
        status = 'completed';
      } else {
        status = 'not-started';
      }

      const item = {
        name: props.Name?.title?.[0]?.plain_text || '',
        status,
        description: props.Description?.rich_text?.[0]?.plain_text || '',
      };

      console.log(`  ✓ ${item.name} [Raw: "${rawStatus}" → Mapped: "${status}"] → ${phase}`);

      // Initialize project if doesn't exist

      // Initialize phase if doesn't exist
      if (!phasesMap[phase]) {
        phasesMap[phase] = {
          id: `${projectSlug}-${phase.toLowerCase().replace(/\s+/g, '-')}`,
          name: phaseName,
          date: date,
          items: [],
        };
      }

      // Add item to phase
      phasesMap[phase].items.push(item);
    });

    // Convert to array format and sort phases by number
    const sortedPhases = Object.entries(phasesMap)
      .sort((a, b) => {
        const getPhaseNumber = (phaseKey) => {
          const match = phaseKey.match(/(\d+)/);
          return match ? parseInt(match[1]) : 999;
        };
        return getPhaseNumber(a[0]) - getPhaseNumber(b[0]);
      })
      .map(([key, value]) => value);

    console.log(`📦 Fetched ${sortedPhases.length} phases for project: ${projectSlug}`);

    res.status(200).json({
      success: true,
      data: sortedPhases,
    });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

