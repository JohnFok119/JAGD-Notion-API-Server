/**
 * Vercel Serverless Function - Test GitHub Connection
 * Endpoint: /api/github/test
 */

const { Octokit } = require('@octokit/rest');

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
    const token = process.env.GITHUB_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        success: false,
        message: 'GitHub token not configured',
      });
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: token });

    // Test connection
    const { data } = await octokit.rest.users.getAuthenticated();

    res.status(200).json({
      success: true,
      message: `Successfully connected as ${data.login}!`,
      data: {
        username: data.login,
        publicRepos: data.public_repos,
      },
    });
  } catch (error) {
    console.error('GitHub API Error:', error);
    res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`,
    });
  }
};
