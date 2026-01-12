# 🔌 JAGD API Server

Serverless API backend integrating multiple data sources: Notion, GitHub, and LeetCode.

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
   - Add all required tokens (see Environment Variables section below)
   - Redeploy

5. **Get your API URL**:
   ```
   https://your-project.vercel.app/api/notion/test
   https://your-project.vercel.app/api/github/test
   https://your-project.vercel.app/api/leetcode/test
   ```

---

## 🧪 Local Testing

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env.local`** (see `ENV_TEMPLATE.md` for details):
   ```bash
   # Copy from ENV_TEMPLATE.md and fill in your values
   NOTION_API_KEY=secret_your_token
   NOTION_CODELENS_DATABASE_ID=your_database_id
   GITHUB_API_TOKEN=ghp_your_token
   # ... (see ENV_TEMPLATE.md for all variables)
   ```

3. **Test connections**:
   ```bash
   npm run test:notion
   npm run test:github
   npm run test:leetcode
   ```

4. **Run locally with Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   vercel dev
   ```
   Then visit: `http://localhost:3000/api/notion/test`

---

## 📡 API Endpoints

### Notion API

#### GET `/api/notion/test`
Test connection to Notion database.

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected! Found 3 items in database.",
  "count": 3
}
```

#### GET `/api/notion/roadmap?projectSlug=CodeLens`
Fetch roadmap data for a specific project (legacy structure: Phases → Items).

**Query Parameters:**
- `projectSlug` (required): Project identifier (e.g., "CodeLens")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "codelens-phase-1",
      "name": "Phase 1: Core Engine",
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
```

#### GET `/api/notion/sprints?projectSlug=CodeLens`
Fetch sprint data with three-level hierarchy (Sprint Weeks → Epics → Tickets).

**Query Parameters:**
- `projectSlug` (required): Project identifier (e.g., "CodeLens")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sprint-1",
      "name": "Sprint 1: Setting Up Environment",
      "sprintNumber": 1,
      "startDate": "2026-01-12",
      "endDate": "2026-01-18",
      "status": "in-progress",
      "epics": [
        {
          "id": "epic-cicd",
          "name": "CI/CD & Operations",
          "status": "in-progress",
          "description": "Continuous Integration/Delivery/Deployment",
          "priority": "High",
          "tickets": [
            {
              "id": "ticket-001",
              "name": "[Ticket-001] - Fork & Clean VSCode Repo",
              "status": "not-started",
              "assignee": "Johnny",
              "storyPoints": 3
            }
          ]
        }
      ]
    }
  ]
}
```

**Setup:** See `docs/SPRINT_SETUP.md` for complete setup instructions

---

### GitHub API

#### GET `/api/github/test`
Test GitHub API connection.

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected as username!",
  "data": {
    "username": "jagdteam",
    "publicRepos": 15
  }
}
```

#### GET `/api/github/contributions?username=giuseppi`
Fetch user's GitHub contributions for the last 5 months.

**Query Parameters:**
- `username` (required): GitHub username

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-12",
      "count": 5
    }
  ]
}
```

**Note:** Uses personal tokens (`[USERNAME]_GITHUB_TOKEN`) if available for private contributions, falls back to org token.

#### GET `/api/github/commits?repo=jagdteam/clicr`
Fetch repository commits filtered to team members.

**Query Parameters:**
- `repo` (required): Repository in format `owner/repo`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4",
      "date": "2025-01-12",
      "week": "This Week",
      "type": "feature",
      "content": "Add user authentication",
      "assignee": "Giuseppi Pelayo",
      "assigneeImg": "/assets/g_pfp.jpg"
    }
  ]
}
```

---

### LeetCode API

#### GET `/api/leetcode/test`
Test LeetCode API connection.

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to LeetCode API!",
  "data": {
    "testUser": "giuseppi"
  }
}
```

#### GET `/api/leetcode/stats?username=giuseppi`
Fetch user's LeetCode statistics and submissions.

**Query Parameters:**
- `username` (required): LeetCode username

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSolved": 150,
    "easySolved": 75,
    "mediumSolved": 50,
    "hardSolved": 25,
    "recentSubmissions": [
      {
        "date": "2025-01-12",
        "count": 3
      }
    ]
  }
}
```

---

## 📁 Project Structure

```
JAGD-Notion-API-Server/
├── api/
│   ├── notion/
│   │   ├── test.js              # Notion health check
│   │   ├── roadmap.js           # Roadmap data endpoint (legacy)
│   │   ├── sprints.js           # Sprint/Epic/Ticket endpoint
│   │   └── test-sprints.js      # Test sprint endpoint
│   ├── github/
│   │   ├── test.js              # GitHub health check
│   │   ├── contributions.js     # User contributions
│   │   └── commits.js           # Repository commits
│   └── leetcode/
│       ├── test.js              # LeetCode health check
│       └── stats.js             # User statistics
├── package.json                 # Dependencies
├── docs/
│   └── SPRINT_SETUP.md          # Sprint management setup guide
├── test-connection.js           # Test Notion API
├── test-github.js               # Test GitHub API
├── test-leetcode.js             # Test LeetCode API
├── .gitignore
├── .env.example                 # Environment variables template
├── ENV_TEMPLATE.md              # Detailed env var guide
├── QUICK_START.md               # Quick deployment guide
├── VERCEL_DEPLOYMENT.md         # Detailed deployment guide
└── README.md
```

---

## 🔧 Environment Variables

### Notion
| Variable | Description |
|----------|-------------|
| `NOTION_API_KEY` | Your Notion integration token (starts with `secret_`) |
| `NOTION_CODELENS_DATABASE_ID` | CodeLens project database ID (legacy roadmap) |
| `NOTION_CODELENS_SPRINTS_DB_ID` | Sprint Weeks database ID (for `/api/notion/sprints`) |
| `NOTION_CODELENS_EPICS_DB_ID` | Epics database ID (for `/api/notion/sprints`) |
| `NOTION_CODELENS_ISSUES_DB_ID` | Issues database ID (for `/api/notion/sprints`) |

**Note:** Sprint-related variables are only needed if using the sprint management endpoint. See `docs/SPRINT_SETUP.md` for setup instructions.

### GitHub
| Variable | Description |
|----------|-------------|
| `GITHUB_API_TOKEN` | Main organization token (required) |
| `GIUSEPPI_GITHUB_TOKEN` | Personal token for Giuseppi (optional, for private contributions) |
| `JOHNNY_GITHUB_TOKEN` | Personal token for Johnny (optional) |
| `ANDREW_GITHUB_TOKEN` | Personal token for Andrew (optional) |
| `DYLAN_GITHUB_TOKEN` | Personal token for Dylan (optional) |

### LeetCode
No API keys required! LeetCode API is public.

**See `ENV_TEMPLATE.md` for detailed setup instructions.**

---

## ⚡ Caching Strategy

All endpoints cache responses until midnight PST for optimal performance:
- **First request after midnight**: Fetches fresh data from APIs
- **Subsequent requests**: Served from Vercel's edge cache (fast!)
- **Automatic refresh**: Cache expires at midnight PST daily

This reduces API rate limits and improves response times significantly.

---

## 🌐 CORS Configuration

The API allows requests from any origin (`Access-Control-Allow-Origin: *`).

For production, consider restricting to your frontend domain:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-frontend.com');
```

---

## 📊 Data Schemas

### Notion Database Schema

Your Notion database should have these columns:

| Column Name | Type | Example |
|-------------|------|---------|
| Name | Title | "PDF parsing & text extraction" |
| Status | Select/Status | "Completed", "In Progress", "Not Started" |
| Description | Text | "Implemented PDF upload..." |
| Phase | Select | "Phase 1", "Phase 2" |
| Phase Name | Text | "Phase 1: Core Engine" |
| Date | Text | "Oct 2024" |

### GitHub Team Members

Team member configuration in `/api/github/commits.js`:

```javascript
const teamMembers = [
  { name: 'Andrew Espinosa', github: 'adespinosa14' },
  { name: 'Giuseppi Pelayo', github: 'giuseppi' },
  { name: 'Johnny Fok', github: 'JohnFok119' },
  { name: 'Dylan Nguyen', github: 'DylanN143' },
];
```

Update this array to match your team.

---

## 🐛 Troubleshooting

### Notion Issues

**"Database ID not configured"**
- Check environment variables are set on Vercel
- Redeploy after adding env vars

**"Could not find database"**
- Ensure database is shared with your Notion integration
- Verify database ID is correct

### GitHub Issues

**"GitHub token not configured"**
- Check `GITHUB_API_TOKEN` is set
- Verify token has correct permissions (`repo`, `read:user`)

**Rate limit errors**
- Use personal tokens for team members to increase rate limits
- Caching reduces API calls significantly

**Empty commits array**
- Verify repository name format: `owner/repo`
- Check if repository has any commits
- Ensure token has access to the repository

### LeetCode Issues

**"User not found or profile is private"**
- Verify username is correct
- User profile must be public
- Try visiting `https://leetcode.com/[username]/` to verify

### General Issues

**CORS errors**
- Check browser console for specific error
- Verify API URL is correct in frontend

**Local testing fails**
- Ensure Vercel CLI is running: `vercel dev`
- Check `.env.local` exists and has correct values
- Port 3000 should be available

---

## 📚 API Summary

| Service | Endpoints | Authentication | Rate Limits |
|---------|-----------|----------------|-------------|
| **Notion** | `/api/notion/*` | API Key required | ~3 req/sec |
| **GitHub** | `/api/github/*` | Token required | 5000 req/hour (per token) |
| **LeetCode** | `/api/leetcode/*` | None | Unknown (public API) |

---

## 🚢 Deployment Checklist

Before deploying to Vercel:

- [ ] All environment variables added to Vercel
- [ ] Dependencies installed locally (`npm install`)
- [ ] Local tests passing (`npm run test:*`)
- [ ] `.gitignore` excludes `.env.local` and `node_modules/`
- [ ] Notion databases shared with integration
- [ ] GitHub tokens have correct scopes
- [ ] Team member info updated in `commits.js`

After deploying:

- [ ] Redeploy after adding environment variables
- [ ] Test all endpoints in production
- [ ] Verify caching headers are set
- [ ] Check Vercel function logs for errors

---

## 📝 License

MIT

