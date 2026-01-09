# Environment Variables Template

Create a `.env.local` file with these variables for local development:

```
VITE_NOTION_API_KEY=secret_your_notion_integration_token_here
VITE_NOTION_DATABASE_ID=your_database_id_here
```

## How to Get These Values

### VITE_NOTION_API_KEY
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Copy the token (starts with `secret_`)

### VITE_NOTION_DATABASE_ID
1. Open your Notion database
2. Look at the URL: `https://notion.so/workspace/<DATABASE_ID>?v=...`
3. Copy the 32-character ID

## For Vercel Deployment

Add these same variables in:
Vercel Dashboard → Your Project → Settings → Environment Variables

