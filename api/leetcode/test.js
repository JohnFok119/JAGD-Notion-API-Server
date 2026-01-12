/**
 * Vercel Serverless Function - Test LeetCode Connection
 * Endpoint: /api/leetcode/test
 */

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Test with a known public user
    const testUser = 'giuseppi';

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': `https://leetcode.com/${testUser}/`,
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
            }
          }
        `,
        variables: { username: testUser },
      }),
    });

    const data = await response.json();

    if (data.data?.matchedUser) {
      res.status(200).json({
        success: true,
        message: 'Successfully connected to LeetCode API!',
        data: {
          testUser: data.data.matchedUser.username,
        },
      });
    } else {
      throw new Error('Unable to verify connection');
    }
  } catch (error) {
    console.error('LeetCode API Error:', error);
    res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`,
    });
  }
};
