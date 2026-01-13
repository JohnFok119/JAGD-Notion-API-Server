/**
 * Vercel Serverless Function - Fetch GitHub Repository Commits
 * Endpoint: /api/github/commits?repo=jagdteam/Education-Project
 */

const fetch = require('node-fetch');

// Helper to calculate seconds until midnight PST
function getSecondsUntilMidnightPST() {
  const now = new Date();
  const pstOffset = -8 * 60;
  const nowPST = new Date(now.getTime() + (pstOffset + now.getTimezoneOffset()) * 60000);
  const tomorrowPST = new Date(nowPST);
  tomorrowPST.setHours(24, 0, 0, 0);
  return Math.floor((tomorrowPST - nowPST) / 1000);
}

// Team members configuration
const teamMembers = [
  { name: 'Andrew Espinosa', github: 'adespinosa14' },
  { name: 'Giuseppi Pelayo', github: 'giuseppi' },
  { name: 'Johnny Fok', github: 'JohnFok119' },
  { name: 'Dylan Nguyen', github: 'DylanN143' },
];

// Helper to get team member image
function getTeamMemberImage(name) {
  const imageMap = {
    'Giuseppi Pelayo': '/assets/g_pfp.jpg',
    'Johnny Fok': '/assets/jf_pfp.jpg',
    'Dylan Nguyen': '/assets/dn_pfp.jpg',
    'Andrew Espinosa': '/assets/ade_pfp.jpeg',
  };
  return imageMap[name];
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { repo } = req.query;

    if (!repo) {
      return res.status(400).json({
        success: false,
        error: 'Repo query parameter is required (format: owner/repo)',
      });
    }

    const token = process.env.GITHUB_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'GitHub token not configured',
      });
    }

    console.log(`📊 Fetching commits for ${repo} (with pagination)`);

    // Fetch ALL commits with pagination
    let allCommits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=100&page=${page}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'JAGD-API-Server',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          // Empty repository
          console.log(`⚠️  Repo ${repo} is empty (no commits yet)`);
          return res.status(200).json({
            success: true,
            data: [],
          });
        }
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const commits = await response.json();
      
      if (commits.length === 0) {
        hasMore = false;
      } else {
        allCommits = allCommits.concat(commits);
        console.log(`   📄 Fetched page ${page}: ${commits.length} commits (total: ${allCommits.length})`);
        
        // If we got less than 100, we're on the last page
        if (commits.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    const commits = allCommits;

    // Process commits
    const devLog = commits
      .map((commit) => {
        const authorName = commit.commit.author.name;
        const authorEmail = commit.commit.author.email;
        const commitDate = new Date(commit.commit.author.date);
        const message = commit.commit.message.split('\n')[0];

        // Find matching team member
        const teamMember = teamMembers.find(
          (m) =>
            m.name.toLowerCase().includes(authorName.toLowerCase()) ||
            authorName.toLowerCase().includes(m.name.split(' ')[0].toLowerCase()) ||
            authorName.toLowerCase().includes(m.name.split(' ')[1]?.toLowerCase() || '') ||
            (m.github && (authorEmail.toLowerCase().includes(m.github.toLowerCase()) || authorName.toLowerCase().includes(m.github.toLowerCase())))
        );

        if (!teamMember) {
          return null; // Skip non-team commits
        }

        // Infer commit type
        let type = 'infra';
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.startsWith('fix:') || lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
          type = 'fix';
        } else if (lowerMessage.startsWith('feat:') || lowerMessage.includes('feature') || lowerMessage.includes('add')) {
          type = 'feature';
        } else if (lowerMessage.includes('design') || lowerMessage.includes('ui') || lowerMessage.includes('style')) {
          type = 'design';
        }

        // Calculate week (temporary, will be inverted)
        const weekNumber = Math.ceil((Date.now() - commitDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

        return {
          id: commit.sha.substring(0, 8),
          date: commitDate.toISOString().split('T')[0],
          weekNumber,
          type,
          content: message,
          assignee: teamMember.name,
          assigneeImg: getTeamMemberImage(teamMember.name),
        };
      })
      .filter((entry) => entry !== null); // Get ALL team commits

    // Invert week numbers (Week 4 = most recent)
    const maxWeek = Math.max(...devLog.map((entry) => entry.weekNumber), 0);

    const finalDevLog = devLog.map((entry) => {
      const invertedWeekNumber = maxWeek - entry.weekNumber + 1;
      const week = entry.weekNumber === 0 ? 'This Week' : `Week ${invertedWeekNumber}`;

      const { weekNumber, ...rest } = entry;
      return { ...rest, week };
    });

    console.log(`✅ Processed ${finalDevLog.length} team commits for ${repo}`);

    // Cache until midnight PST
    const secondsUntilMidnight = getSecondsUntilMidnightPST();
    res.setHeader('Cache-Control', `s-maxage=${secondsUntilMidnight}, must-revalidate`);

    res.status(200).json({
      success: true,
      data: finalDevLog,
    });
  } catch (error) {
    console.error('GitHub API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
