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
    const { repo, since } = req.query;

    if (!repo) {
      return res.status(400).json({
        success: false,
        error: 'Repo query parameter is required (format: owner/repo)',
      });
    }

    // Use token rotation to increase rate limit (5k requests/hour per token)
    // Rotate through available tokens to multiply the rate limit
    const availableTokens = [process.env.GITHUB_API_TOKEN, process.env.GIUSEPPI_GITHUB_TOKEN, process.env.JOHNFOK119_GITHUB_TOKEN].filter(Boolean);

    if (availableTokens.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'GitHub token not configured',
      });
    }

    // Simple rotation: use hash of repo name to distribute load
    const tokenIndex = Math.abs(repo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % availableTokens.length;
    const token = availableTokens[tokenIndex];

    console.log(`🔑 Using token ${tokenIndex + 1}/${availableTokens.length} for ${repo}`);

    // Validate since date if provided
    let sinceParam = '';
    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid since date format. Use YYYY-MM-DD or ISO 8601 format',
        });
      }
      sinceParam = `&since=${sinceDate.toISOString()}`;
      console.log(`📊 Fetching commits for ${repo} since ${since} (author-filtered, parallel)`);
    } else {
      console.log(`📊 Fetching commits for ${repo} (author-filtered, parallel)`);
    }

    // Fetch commits in parallel for each team member using author parameter
    // This is MUCH more efficient than pagination, especially for forked repos
    let hasAnyError = false;
    let errorDetails = [];

    const fetchPromises = teamMembers.map(async (member) => {
      try {
        const url = `https://api.github.com/repos/${repo}/commits?author=${member.github}&per_page=100${sinceParam}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'JAGD-API-Server',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();

          // Check for rate limiting
          if (response.status === 403 && errorText.includes('rate limit')) {
            const resetTime = response.headers.get('x-ratelimit-reset');
            const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
            console.error(`   ❌ ${member.name}: GitHub API rate limit exceeded (resets at ${resetDate})`);
            hasAnyError = true;
            errorDetails.push(
              `${member.name}: Rate limit exceeded (resets at ${resetDate?.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })} PST)`
            );
            return [];
          }

          if (response.status === 409) {
            console.log(`   ⚠️  ${member.name}: Repository is empty`);
            return [];
          }
          if (response.status === 404) {
            console.log(`   ⚠️  ${member.name}: Repository not found or no commits`);
            hasAnyError = true;
            errorDetails.push(`${member.name}: Repo not found (404)`);
            return [];
          }
          console.error(`   ❌ ${member.name}: GitHub API returned ${response.status} - ${errorText}`);
          hasAnyError = true;
          errorDetails.push(`${member.name}: HTTP ${response.status}`);
          return [];
        }

        const commits = await response.json();
        console.log(`   ✅ ${member.name} (@${member.github}): ${commits.length} commits`);

        // Tag each commit with the team member info
        return commits.map((commit) => ({
          ...commit,
          _teamMember: member,
        }));
      } catch (error) {
        console.error(`   ❌ ${member.name}: ${error.message}`);
        hasAnyError = true;
        errorDetails.push(`${member.name}: ${error.message}`);
        return [];
      }
    });

    // Wait for all parallel requests to complete
    const allCommitArrays = await Promise.all(fetchPromises);

    // Flatten the arrays and sort by date (newest first)
    const allCommits = allCommitArrays.flat().sort((a, b) => new Date(b.commit.author.date) - new Date(a.commit.author.date));

    console.log(`📦 Total commits fetched: ${allCommits.length}`);

    // If no commits found for any team member, return helpful message
    if (allCommits.length === 0) {
      console.log(`⚠️  No commits found for any team member in ${repo}`);

      if (hasAnyError) {
        console.error(`❌ Errors occurred: ${errorDetails.join(', ')}`);

        // Check if it's a rate limit issue
        const isRateLimited = errorDetails.some((detail) => detail.includes('Rate limit'));
        if (isRateLimited) {
          return res.status(429).json({
            success: false,
            error: 'GitHub API rate limit exceeded. Please try again later.',
            details: errorDetails,
          });
        }

        return res.status(404).json({
          success: false,
          error: `Repository not found or inaccessible: ${repo}`,
          details: errorDetails,
        });
      }

      return res.status(200).json({
        success: true,
        data: [],
        message: 'No commits found for team members in this repository. Team members may not have commits yet.',
      });
    }

    const commits = allCommits;

    // Process commits (already filtered by author, no need to search for team member)
    const devLog = commits.map((commit) => {
      const teamMember = commit._teamMember; // Already attached from parallel fetch
      const commitDate = new Date(commit.commit.author.date);
      const message = commit.commit.message.split('\n')[0];

      // Infer commit type from message
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
    });

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
