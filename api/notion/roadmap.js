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
      const notionStatus = props.Status?.select?.name?.toLowerCase() || 'not started';
      
      // Map Notion status to our format
      let status;
      if (notionStatus.includes('progress')) {
        status = 'in-progress';
      } else if (notionStatus === 'completed') {
        status = 'completed';
      } else {
        status = 'not-started';
      }

      const item = {
        name: props.Name?.title?.[0]?.plain_text || '',
        status,
        description: props.Description?.rich_text?.[0]?.plain_text || '',
      };

      console.log(`  ✓ ${item.name} [${status}] → ${project} / ${phase}`);

      // Initialize project if doesn't exist
      if (!projectsMap[project]) {
        projectsMap[project] = {};
      }

      // Initialize phase if doesn't exist
      if (!projectsMap[project][phase]) {
        projectsMap[project][phase] = {
          id: `${project}-${phase.toLowerCase().replace(/\s+/g, '-')}`,
          name: phaseName,
          status: 'planned', // Will be updated based on items
          date: date,
          items: [],
        };
      }

      // Add item to phase
      projectsMap[project][phase].items.push(item);
    });

    // Determine phase status based on items
    Object.values(projectsMap).forEach(phases => {
      Object.values(phases).forEach(phase => {
        const allCompleted = phase.items.every(item => item.status === 'completed');
        const someInProgress = phase.items.some(item => item.status === 'in-progress');
        const someCompleted = phase.items.some(item => item.status === 'completed');
        
        if (allCompleted) {
          phase.status = 'completed';
        } else if (someInProgress || someCompleted) {
          phase.status = 'in-progress';
        } else {
          phase.status = 'planned';
        }
      });
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

