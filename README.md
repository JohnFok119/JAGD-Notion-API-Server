# 🔌 JAGD Notion API Backend

Serverless API backend for fetching roadmap data from Notion.

## 🚀 Quick Deploy to Vercel

1. **Create new GitHub repo** for this backend (e.g., `jagd-notion-api`)

2. **Push this folder** to the new repo:
   ```bash
   cd notion-api-backend
   git init
   git add .
   git commit -m "Initial commit - Notion API backend"
   git remote add origin https://github.com/YOUR_USERNAME/jagd-notion-api.git
   git push -u origin main
   ```

3. **Deploy to Vercel**:
   - Go to https://vercel.com/new
   - Import your new GitHub repo
   - Click "Deploy"

4. **Add Environment Variables** on Vercel:
   - Settings → Environment Variables
   - Add `VITE_NOTION_API_KEY` = your Notion integration token
   - Add `VITE_NOTION_DATABASE_ID` = your Notion database ID
   - Redeploy

5. **Get your API URL**:
   ```
   https://your-project.vercel.app/api/notion/test
   https://your-project.vercel.app/api/notion/roadmap
   ```

---

## 🧪 Local Testing

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env.local`**:
   ```
   VITE_NOTION_API_KEY=secret_your_token
   VITE_NOTION_DATABASE_ID=your_database_id
   ```

3. **Test connection**:
   ```bash
   npm test
   ```

4. **Run locally with Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   vercel dev
   ```
   Then visit: `http://localhost:3000/api/notion/test`

---

## 📡 API Endpoints

### GET `/api/notion/test`
Test connection to Notion database.

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected! Found 3 items in database.",
  "count": 3
}
```

### GET `/api/notion/roadmap?projectSlug=scholarlens-ai`
Fetch roadmap data for a specific project.

**Response:**
```json
{
  "success": true,
  "data": {
    "scholarlens-ai": [
      {
        "id": "scholarlens-ai-phase-1",
        "name": "Phase 1: Core Engine",
        "status": "completed",
        "date": "Oct 2024",
        "items": [
          {
            "name": "PDF parsing & text extraction",
            "status": "completed",
            "description": "Implemented PDF upload endpoint"
          }
        ]
      }
    ]
  }
}
```

---

## 📁 Project Structure

```
notion-api-backend/
├── api/
│   └── notion/
│       ├── test.js       # Test endpoint
│       └── roadmap.js    # Roadmap data endpoint
├── package.json          # Dependencies
├── vercel.json           # Vercel configuration
├── test-connection.js    # Local test script
├── .env.example          # Environment variables template
├── .gitignore
└── README.md
```

---

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_NOTION_API_KEY` | Your Notion integration token (starts with `secret_`) |
| `VITE_NOTION_DATABASE_ID` | Your Notion database ID (32 characters) |

---

## 🌐 CORS Configuration

The API allows requests from any origin (`Access-Control-Allow-Origin: *`).

For production, consider restricting to your frontend domain:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-frontend.com');
```

---

## 📊 Notion Database Schema

Your Notion database should have these columns:

| Column Name | Type | Example |
|-------------|------|---------|
| Name | Title | "PDF parsing & text extraction" |
| Status | Select | "Completed", "In Progress", "Not Started" |
| Description | Text | "Implemented PDF upload..." |
| Project | Text | "scholarlens-ai" |
| Phase | Select | "Phase 1", "Phase 2" |
| Phase Name | Text | "Phase 1: Core Engine" |
| Date | Text | "Oct 2024" |

---

## 🐛 Troubleshooting

**"Database ID not configured"**
- Check environment variables are set on Vercel
- Redeploy after adding env vars

**"Could not find database"**
- Ensure database is shared with your Notion integration
- Verify database ID is correct

**CORS errors**
- Check browser console for specific error
- Verify API URL is correct in frontend

---

## 📝 License

MIT

