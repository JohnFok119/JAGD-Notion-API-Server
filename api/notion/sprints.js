/**
 * Vercel Serverless Function - Fetch Sprint/Epic/Ticket Data
 * Endpoint: /api/notion/sprints
 * 
 * Database Schema:
 * - Sprints: Name (title), Start Date (date), End Date (date), Status (status/select)
 * - Epics: Name (title), Description (text), Status (status/select), Priority (select)
 * - Issues: Issue (title), Status (status/select), Assignee (person), Story Points (number)
 *           Sprints (relation), Epics (relation)
 * 
 * Returns nested hierarchy: Sprint → Epic → Tickets
 */

const { Client } = require('@notionhq/client');

// Helper to calculate seconds until midnight PST
function getSecondsUntilMidnightPST() {
  const now = new Date();
  const pstOffset = -8 * 60;
  const nowPST = new Date(now.getTime() + (pstOffset + now.getTimezoneOffset()) * 60000);
  const tomorrowPST = new Date(nowPST);
  tomorrowPST.setHours(24, 0, 0, 0);
  return Math.floor((tomorrowPST - nowPST) / 1000);
}

// Helper to normalize status
function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'not-started';
  const status = rawStatus.toLowerCase().trim();
  if (status.includes('progress') || status.includes('in progress')) {
    return 'in-progress';
  } else if (status.includes('completed') || status.includes('complete') || status.includes('done')) {
    return 'completed';
  }
  return 'not-started';
}

// Helper to extract text from rich text or title
function extractText(property) {
  if (!property) return '';
  if (property.title) return property.title[0]?.plain_text || '';
  if (property.rich_text) return property.rich_text[0]?.plain_text || '';
  return '';
}

// Helper to extract date
function extractDate(dateProperty) {
  if (!dateProperty?.date) return null;
  return dateProperty.date.start || null;
}

// Helper to extract all person names
function extractPerson(personProperty) {
  if (!personProperty?.people || personProperty.people.length === 0) return [];
  return personProperty.people.map(person => person.name).filter(name => name);
}

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

    // Database ID mapping for different projects
    const DATABASE_MAP = {
      'CodeLens': {
        sprints: process.env.NOTION_CODELENS_SPRINTS_DB_ID,
        epics: process.env.NOTION_CODELENS_EPICS_DB_ID,
        issues: process.env.NOTION_CODELENS_ISSUES_DB_ID || process.env.NOTION_CODELENS_TICKETS_DB_ID,
      },
      'Clutch': {
        sprints: process.env.NOTION_CLUTCH_SPRINTS_DB_ID,
        epics: process.env.NOTION_CLUTCH_EPICS_DB_ID,
        issues: process.env.NOTION_CLUTCH_ISSUES_DB_ID || process.env.NOTION_CLUTCH_TICKETS_DB_ID,
      },
      // Add more projects here
    };

    const databases = DATABASE_MAP[projectSlug];

    if (!databases || !databases.sprints || !databases.epics || !databases.issues) {
      return res.status(400).json({
        success: false,
        error: `Database IDs not configured for projectSlug: ${projectSlug}`,
      });
    }

    // Initialize Notion client
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    console.log(`📊 Fetching data for project: ${projectSlug}`);

    // Fetch all three databases in parallel
    const [sprintsResponse, epicsResponse, issuesResponse] = await Promise.all([
      notion.databases.query({ database_id: databases.sprints }),
      notion.databases.query({ database_id: databases.epics }),
      notion.databases.query({ database_id: databases.issues }),
    ]);

    console.log(`  ✓ Sprints: ${sprintsResponse.results.length}`);
    console.log(`  ✓ Epics: ${epicsResponse.results.length}`);
    console.log(`  ✓ Issues: ${issuesResponse.results.length}`);

    // Build epics map by ID for quick lookup
    const epicsById = {};
    epicsResponse.results.forEach((page) => {
      const props = page.properties;
      epicsById[page.id] = {
        id: page.id,
        name: extractText(props.Name),
        status: normalizeStatus(props.Status?.status?.name || props.Status?.select?.name),
        description: extractText(props.Description), // Description is text type
        priority: props.Priority?.select?.name || null,
        tickets: [], // Will populate with tickets
      };
    });

    // Process issues/tickets - they link to BOTH sprints and epics
    const issuesBySprintId = {}; // Group issues by sprint
    const issuesByEpicId = {};   // Group issues by epic

    issuesResponse.results.forEach((page) => {
      const props = page.properties;
      
      // Extract sprint relation(s) - Issues can be in multiple sprints
      const sprintRelations = props.Sprints?.relation || props.Sprint?.relation || [];
      
      // Extract epic relation(s) - Issues can be in multiple epics
      const epicRelations = props.Epics?.relation || props.Epic?.relation || [];

      // Build ticket object
      const ticket = {
        id: page.id,
        name: extractText(props.Issue), // Tickets use "Issue" column, not "Name"
        status: normalizeStatus(props.Status?.status?.name || props.Status?.select?.name),
        assignees: extractPerson(props['Assigned To']), // Array of assigned people (note: property name has a space)
        storyPoints: props['Story Points']?.number || null, // Number type
      };

      // Add ticket to each sprint it belongs to
      sprintRelations.forEach((sprintRel) => {
        if (!issuesBySprintId[sprintRel.id]) {
          issuesBySprintId[sprintRel.id] = [];
        }
        issuesBySprintId[sprintRel.id].push(ticket);
      });

      // Add ticket to each epic it belongs to
      epicRelations.forEach((epicRel) => {
        if (!issuesByEpicId[epicRel.id]) {
          issuesByEpicId[epicRel.id] = [];
        }
        issuesByEpicId[epicRel.id].push(ticket);
      });
    });

    // Populate epics with their tickets
    Object.keys(epicsById).forEach((epicId) => {
      epicsById[epicId].tickets = issuesByEpicId[epicId] || [];
    });

    // Build sprint structure
    const sprints = sprintsResponse.results.map((page) => {
      const props = page.properties;
      const sprintId = page.id;

      // Get all issues for this sprint
      const sprintIssues = issuesBySprintId[sprintId] || [];

      // Find all unique epics mentioned in this sprint's issues
      const epicIdsInSprint = new Set();
      issuesResponse.results.forEach((issuePage) => {
        const issueProps = issuePage.properties;
        const issueSprintRelations = issueProps.Sprints?.relation || issueProps.Sprint?.relation || [];
        const issueEpicRelations = issueProps.Epics?.relation || issueProps.Epic?.relation || [];
        
        // If this issue belongs to current sprint
        if (issueSprintRelations.some(s => s.id === sprintId)) {
          // Add all its epics to the set
          issueEpicRelations.forEach(e => epicIdsInSprint.add(e.id));
        }
      });

      // Build epics array for this sprint (only epics that have tickets in this sprint)
      const epicsForSprint = Array.from(epicIdsInSprint)
        .map(epicId => {
          if (!epicsById[epicId]) return null;
          
          // Filter tickets to only those in this sprint
          const ticketsInThisSprintAndEpic = sprintIssues.filter(issue => {
            // Find original issue page to check its epic relations
            const issuePage = issuesResponse.results.find(p => p.id === issue.id);
            if (!issuePage) return false;
            const issueEpicRels = issuePage.properties.Epics?.relation || issuePage.properties.Epic?.relation || [];
            return issueEpicRels.some(e => e.id === epicId);
          });

          return {
            ...epicsById[epicId],
            tickets: ticketsInThisSprintAndEpic,
          };
        })
        .filter(epic => epic !== null);

      return {
        id: sprintId,
        name: extractText(props.Name), // Sprint name only, no separate sprint number column
        startDate: extractDate(props['Start Date']) || extractDate(props.Start),
        endDate: extractDate(props['End Date']) || extractDate(props.End),
        status: normalizeStatus(props.Status?.status?.name || props.Status?.select?.name),
        epics: epicsForSprint,
      };
    });

    // Sort sprints by name (since there's no sprint number column)
    const sortedSprints = sprints.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    console.log(`📦 Built ${sortedSprints.length} sprints with full hierarchy`);

    // Cache until midnight PST
    const secondsUntilMidnight = getSecondsUntilMidnightPST();
    res.setHeader('Cache-Control', `s-maxage=${secondsUntilMidnight}, must-revalidate`);

    res.status(200).json({
      success: true,
      data: sortedSprints,
    });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
