# 🚀 Vercel Deployment Guide

## Step-by-Step Deployment

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Push Code to GitHub

Make sure all your changes are committed and pushed:

```bash
git add .
git commit -m "[Feature] - Added Notion API integration with Vercel serverless functions"
git push origin main
```

### 3. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. **Import your GitHub repository**
4. Vercel will auto-detect settings
5. Click **"Deploy"**

#### Option B: Using Vercel CLI

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time)
- What's your project's name? `jagd-notion-api` (or whatever you want)
- In which directory is your code located? `./`
- Deploy? **Y**

### 4. Set Environment Variables on Vercel

After deployment, you need to add your Notion credentials:

1. Go to your project on Vercel
2. Click **"Settings"** → **"Environment Variables"**
3. Add these variables:

| Variable Name | Value |
|---------------|-------|
| `NOTION_API_KEY` | `secret_your_notion_token_here` |
| `NOTION_DATABASE_ID` | `your_database_id_here` |

4. Click **"Save"**
5. **Redeploy** the project for env vars to take effect

### 5. Get Your API URL

After deployment, you'll get a URL like:
```
https://your-project-name.vercel.app
```

Your API endpoints will be:
- Test: `https://your-project-name.vercel.app/api/notion/test`
- Roadmap: `https://your-project-name.vercel.app/api/notion/roadmap`

### 6. Update Loveable Frontend

In Loveable (your frontend deployment):

1. Go to **Environment Variables**
2. Add:
   ```
   VITE_NOTION_API_URL=https://your-project-name.vercel.app/api/notion
   ```
3. Redeploy Loveable

---

## 🧪 Testing Your Vercel Deployment

### Test the Connection

Visit in your browser:
```
https://your-project-name.vercel.app/api/notion/test
```

Should return:
```json
{
  "success": true,
  "message": "Successfully connected! Found X items in database.",
  "count": X
}
```

### Test the Roadmap API

Visit:
```
https://your-project-name.vercel.app/api/notion/roadmap?projectSlug=scholarlens-ai
```

Should return your grouped roadmap data.

---

## 📁 File Structure

```
your-project/
├── api/
│   └── notion/
│       ├── test.js          # Test endpoint
│       └── roadmap.js       # Roadmap endpoint
├── server/
│   └── notion-api.cjs       # Local dev server (keep for testing)
├── src/
│   └── ...                  # Your React frontend code
├── vercel.json              # Vercel configuration
└── package.json
```

---

## 🔄 Local Development vs Production

### Local Development:
```bash
# Terminal 1 - Local backend
npm run notion-server

# Terminal 2 - Local frontend  
npm run dev
```

Uses: `http://localhost:3001/api/notion`

### Production:
- Backend: Deployed on Vercel (serverless)
- Frontend: Deployed on Loveable
- Frontend calls: `https://your-project.vercel.app/api/notion`

---

## 🐛 Troubleshooting

### "Database ID not configured"
- Check environment variables are set on Vercel
- Redeploy after adding env vars

### CORS Errors
- The serverless functions include CORS headers
- If still having issues, check the origin in your Loveable deployment

### "Could not find database"
- Make sure your Notion database is shared with the integration
- Verify the database ID is correct

### Vercel Build Fails
- Check the build logs in Vercel dashboard
- Make sure `@notionhq/client` is in `dependencies` (not `devDependencies`)

---

## 📊 Monitoring

View logs in Vercel:
1. Go to your project dashboard
2. Click **"Deployments"**
3. Click on a deployment
4. Click **"Functions"** → Select a function → View logs

---

## 💰 Cost

Vercel Free Tier includes:
- ✅ 100GB bandwidth
- ✅ Serverless function executions
- ✅ Automatic HTTPS
- ✅ More than enough for this use case!

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Project deployed to Vercel
- [ ] Environment variables added on Vercel
- [ ] Project redeployed after adding env vars
- [ ] Test endpoint works
- [ ] Roadmap endpoint works
- [ ] Frontend environment variable updated in Loveable
- [ ] Frontend redeployed
- [ ] Full integration tested

---

## 🎉 Success!

Your Notion API is now serverless and deployed! Update your Notion database and changes will reflect immediately on your website. No need to redeploy! 🚀

