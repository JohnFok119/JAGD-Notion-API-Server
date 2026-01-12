/**
 * Vercel Serverless Function - Fetch LeetCode Stats
 * Endpoint: /api/leetcode/stats?username=giuseppi
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

    console.log(`📊 Fetching LeetCode stats for ${username}`);

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': `https://leetcode.com/${username}/`,
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
              userCalendar {
                submissionCalendar
              }
            }
          }
        `,
        variables: { username },
      }),
    });

    const data = await response.json();
    const user = data.data?.matchedUser;

    if (!user) {
      console.warn(`⚠️  No LeetCode data found for ${username}`);
      return res.status(404).json({
        success: false,
        error: `User ${username} not found or profile is private`,
      });
    }

    // Parse submission stats
    const stats = user.submitStats.acSubmissionNum;
    const totalSolved = stats.find((s) => s.difficulty === 'All')?.count || 0;
    const easySolved = stats.find((s) => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = stats.find((s) => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = stats.find((s) => s.difficulty === 'Hard')?.count || 0;

    // Parse calendar data (last 5 months)
    const calendar = JSON.parse(user.userCalendar.submissionCalendar);
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

    const recentSubmissions = [];
    Object.entries(calendar).forEach(([timestamp, count]) => {
      const date = new Date(parseInt(timestamp) * 1000);
      if (date >= fiveMonthsAgo) {
        recentSubmissions.push({
          date: date.toISOString().split('T')[0],
          count: count,
        });
      }
    });

    console.log(`✅ ${username}: ${totalSolved} problems solved, ${recentSubmissions.length} active days`);

    // Cache until midnight PST
    const secondsUntilMidnight = getSecondsUntilMidnightPST();
    res.setHeader('Cache-Control', `s-maxage=${secondsUntilMidnight}, must-revalidate`);

    res.status(200).json({
      success: true,
      data: {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error('LeetCode API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
