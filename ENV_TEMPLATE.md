# Environment Variables Template

Create a `.env.local` file with these variables for local development:

```bash
# Notion API
NOTION_API_KEY=secret_your_notion_integration_token_here
NOTION_CODELENS_DATABASE_ID=your_codelens_database_id_here

# GitHub - Main organization token
GITHUB_API_TOKEN=ghp_your_main_token_here

# GitHub - Individual member tokens for private contributions
GIUSEPPI_GITHUB_TOKEN=ghp_your_token_here
JOHNNY_GITHUB_TOKEN=ghp_your_token_here
ANDREW_GITHUB_TOKEN=ghp_your_token_here
DYLAN_GITHUB_TOKEN=ghp_your_token_here

# LeetCode - No tokens needed (public API)
```

## How to Get These Values

### NOTION_API_KEY
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Copy the token (starts with `secret_`)

### NOTION_DATABASE_ID
1. Open your Notion database
2. Look at the URL: `https://notion.so/workspace/<DATABASE_ID>?v=...`
3. Copy the 32-character ID

### GITHUB_API_TOKEN
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Select scopes: `repo`, `read:user`
4. Copy the token (starts with `ghp_`)

### Individual GitHub Tokens
For each team member:
1. Each member creates their own personal access token
2. Same process as above
3. Add as `[USERNAME]_GITHUB_TOKEN` in environment variables
4. Enables fetching private contribution data

### LeetCode
No API key needed! LeetCode API is public.

## For Vercel Deployment

Add these same variables in:
Vercel Dashboard → Your Project → Settings → Environment Variables

**Important:** After adding environment variables on Vercel, you must **redeploy** for them to take effect.

