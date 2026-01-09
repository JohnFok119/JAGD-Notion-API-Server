# ⚡ Quick Start - 5 Minutes

## 1. Create New GitHub Repo

1. Go to GitHub.com
2. Click **"New Repository"**
3. Name: `jagd-notion-api` (or any name you want)
4. Make it **Public** or **Private**
5. **Don't** initialize with README (we already have one)
6. Click **"Create repository"**

## 2. Push This Folder to GitHub

```bash
# Navigate to this folder
cd notion-api-backend

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Notion API backend"

# Link to your new GitHub repo (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/jagd-notion-api.git

# Push
git push -u origin main
```

## 3. Deploy to Vercel

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select **jagd-notion-api** (the repo you just created)
4. Click **"Deploy"** (keep all defaults)
5. ⏱️ Wait 1-2 minutes...

## 4. Add Environment Variables

Once deployed:

1. Click **"Settings"** tab
2. Click **"Environment Variables"**
3. Add:
   - Name: `NOTION_API_KEY`
   - Value: `secret_your_notion_token`
   - Click **"Add"**
4. Add:
   - Name: `NOTION_DATABASE_ID`
   - Value: `your_database_id`
   - Click **"Add"**
5. Click **"Deployments"** tab → **"Redeploy"** button

## 5. Test Your API

Visit:
```
https://your-project-name.vercel.app/api/notion/test
```

Should see:
```json
{"success": true, "message": "Successfully connected!..."}
```

## 6. Update Frontend

In **Loveable** (your main website):

1. Add environment variable:
   ```
   VITE_NOTION_API_URL = https://your-project-name.vercel.app/api/notion
   ```
2. **Redeploy** Loveable

## ✅ Done!

Your backend is live! Update Notion → Changes appear on website! 🎉

---

**Need help?** Check `README.md` for detailed docs.

