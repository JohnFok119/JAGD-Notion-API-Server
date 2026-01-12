/**
 * Vercel Serverless Function - Fetch GitHub Contributions
 * Endpoint: /api/github/contributions?username=giuseppi
 */

const fetch = require('node-fetch');

// Helper to calculate seconds until midnight PST
function getSecondsUntilMidnightPST() {
  const now = new Date();

  // Convert to PST (UTC-8, or UTC-7 during DST)
  const pstOffset = -8 * 60; // PST is UTC-8
  const nowPST = new Date(now.getTime() + (pstOffset + now.getTimezoneOffset()) * 60000);

  // Set to next midnight PST
  const tomorrowPST = new Date(nowPST);
  tomorrowPST.setHours(24, 0, 0, 0);

  return Math.floor((tomorrowPST - nowPST) / 1000);
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
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username query parameter is required',
      });
    }

    // Get the appropriate token (user-specific or main token)
    const userTokenKey = `${username.toUpperCase()}_GITHUB_TOKEN`;
    const token = process.env[userTokenKey] || process.env.GITHUB_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'GitHub token not configured',
      });
    }

    console.log(`📊 Fetching GitHub contributions for ${username} using ${process.env[userTokenKey] ? 'personal' : 'org'} token`);

    // Calculate 5 months ago
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

    // GraphQL query
    const query = `
      query($username: String!, $from: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          username,
          from: fiveMonthsAgo.toISOString(),
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('❌ GitHub GraphQL API errors:', data.errors);
      return res.status(500).json({
        success: false,
        error: data.errors[0].message || 'GitHub API error',
      });
    }

    if (!data.data?.user) {
      return res.status(404).json({
        success: false,
        error: `User ${username} not found`,
      });
    }

    const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
    const contributions = [];

    weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        contributions.push({
          date: day.date,
          count: day.contributionCount,
        });
      });
    });

    const totalContributions = data.data.user.contributionsCollection.contributionCalendar.totalContributions;
    const activeDays = contributions.filter((c) => c.count > 0).length;

    console.log(`✅ ${username}: ${totalContributions} total contributions, ${activeDays} active days`);

    // Cache until midnight PST
    const secondsUntilMidnight = getSecondsUntilMidnightPST();
    res.setHeader('Cache-Control', `s-maxage=${secondsUntilMidnight}, must-revalidate`);

    res.status(200).json({
      success: true,
      data: contributions,
    });
  } catch (error) {
    console.error('GitHub API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
