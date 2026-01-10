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
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

    if (!DATABASE_ID) {
      return res.status(500).json({
        success: false,
        error: 'Database ID not configured',
      });
    }

    // Initialize Notion client
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    const queryOptions = {
      database_id: DATABASE_ID,
    };

    // Add filter if projectSlug is provided
    if (projectSlug) {
      queryOptions.filter = {
        property: 'Project',
        rich_text: {
          equals: projectSlug,
        },
      };
    }

    const response = await notion.databases.query(queryOptions);

    console.log(`📊 Fetched ${response.results.length} items from Notion`);
    if (projectSlug) {
      console.log(`🔍 Filtered by project: ${projectSlug}`);
    }

    // Group items by project and phase
    const projectsMap = {};

    response.results.forEach((page) => {
      const props = page.properties;
      
      const project = props.Project?.rich_text?.[0]?.plain_text || '';
      const phaseName = props['Phase Name']?.rich_text?.[0]?.plain_text || '';
      const phase = props.Phase?.select?.name || '';
      const date = props.Date?.rich_text?.[0]?.plain_text || '';
      
      // Get raw status from Notion
      const rawStatus = props.Status?.select?.name || 'Not Started';
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

      console.log(`  ✓ ${item.name} [Raw: "${rawStatus}" → Mapped: "${status}"] → ${project} / ${phase}`);

      // Initialize project if doesn't exist
      if (!projectsMap[project]) {
        projectsMap[project] = {};
      }

      // Initialize phase if doesn't exist
      if (!projectsMap[project][phase]) {
        projectsMap[project][phase] = {
          id: `${project}-${phase.toLowerCase().replace(/\s+/g, '-')}`,
          name: phaseName,
          date: date,
          items: [],
        };
      }

      // Add item to phase
      projectsMap[project][phase].items.push(item);
    });

    // Convert to array format
    const result = {};
    Object.entries(projectsMap).forEach(([project, phases]) => {
      result[project] = Object.values(phases);
      console.log(`📦 Project: ${project} → ${Object.keys(phases).length} phases`);
    });

    console.log(`✅ Returning grouped roadmap data`);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

