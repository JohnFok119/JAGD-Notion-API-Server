# Sprint Management Setup Guide

## Your Notion Structure

You have **three separate Notion databases**:
- **Sprints** - Sprint planning and tracking
- **Epics** - Feature groupings
- **Issues** - Individual tickets/tasks

Where **Issues** link directly to BOTH:
- Sprint (relation to Sprints database)
- Epic (relation to Epics database)

---

## Setup Steps

### Step 1: Get Your Database IDs (5 minutes)

1. Open each database in Notion (Sprints, Epics, Issues)
2. For each database:
   - Click **Share** (top right)
   - Click **Copy link**
3. Extract the database ID from each URL:

```
https://www.notion.so/workspace/2e4f91e0bc3b81c1a2e2df030176ff7a?v=...
                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                This is your database ID
```

**Based on your export, your IDs appear to be:**
- Sprints: `2e4f91e0bc3b81f9b251d9be9a274f50`
- Epics: `2e4f91e0bc3b819fbc0ed5746d2f1aba`
- Issues: `2e4f91e0bc3b81c1a2e2df030176ff7a`

> **Note:** These IDs might need dashes. Try both formats if one doesn't work:
> - Without dashes: `2e4f91e0bc3b81c1a2e2df030176ff7a`
> - With dashes: `2e4f91e0-bc3b-81c1-a2e2-df030176ff7a`

### Step 2: Share Databases with Integration

1. Go to each database (Sprints, Epics, Issues)
2. Click **Share** (top right)
3. Search for your Notion integration
4. Click **Invite**

Repeat for all three databases!

### Step 3: Configure Environment Variables

Create/update your `.env` file:

```env
# Notion API Key (from https://www.notion.so/my-integrations)
NOTION_API_KEY=secret_your_integration_token_here

# Database IDs
NOTION_CODELENS_SPRINTS_DB_ID=your_sprints_database_id
NOTION_CODELENS_EPICS_DB_ID=your_epics_database_id
NOTION_CODELENS_ISSUES_DB_ID=your_issues_database_id
```

### Step 4: Test Locally

```bash
node api/notion/test-sprints.js
```

**Expected output:**
```
🚀 Testing Sprint/Epic/Ticket Endpoint...

Required Environment Variables:
  NOTION_API_KEY: ✓ Set
  NOTION_CODELENS_SPRINTS_DB_ID: ✓ Set
  NOTION_CODELENS_EPICS_DB_ID: ✓ Set
  NOTION_CODELENS_ISSUES_DB_ID: ✓ Set

📊 Fetching data for project: CodeLens
  ✓ Sprints: 4
  ✓ Epics: 3
  ✓ Issues: 6
📦 Built 4 sprints with full hierarchy
```

### Step 5: Deploy to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add all four variables:
   - `NOTION_API_KEY`
   - `NOTION_CODELENS_SPRINTS_DB_ID`
   - `NOTION_CODELENS_EPICS_DB_ID`
   - `NOTION_CODELENS_ISSUES_DB_ID`
3. **Redeploy** (important!)

### Step 6: Test Production

```bash
curl "https://your-domain.vercel.app/api/notion/sprints?projectSlug=CodeLens"
```

---

## API Endpoint

```
GET /api/notion/sprints?projectSlug=CodeLens
```

### Response Structure

```json
{
  "success": true,
  "data": [
    {
      "id": "sprint-id",
      "name": "Sprint 1: Setting Up Environment",
      "sprintNumber": 1,
      "startDate": "2026-01-12",
      "endDate": "2026-01-18",
      "status": "in-progress",
      "epics": [
        {
          "id": "epic-id",
          "name": "CI/CD & Operations",
          "status": "in-progress",
          "description": "Continuous Integration/Delivery/Deployment",
          "priority": "High",
          "tickets": [
            {
              "id": "ticket-id",
              "name": "[Ticket-001] - Fork & Clean VSCode Repo",
              "status": "not-started",
              "description": "",
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

---

## Required Notion Properties

### Sprints Database
- **Name** (Title) - Required
- **Sprint Number** (Number) - Optional
- **Start Date** (Date) - Optional
- **End Date** (Date) - Optional
- **Status** (Status or Select) - Optional

### Epics Database
- **Name** (Title) - Required
- **Status** (Status or Select) - Optional
- **Goal** or **Description** (Text) - Optional
- **Priority** (Select) - Optional

### Issues Database
- **Issue** or **Name** (Title) - Required
- **Sprints** (Relation to Sprints database) - **Required**
- **Epics** (Relation to Epics database) - **Required**
- **Status** (Status or Select) - Optional
- **Assigned To** (Person) - Optional
- **Story Point Estimate** (Number) - Optional

> The API is flexible with property names and will try common variations.

---

## Troubleshooting

### "Database ID not configured"
→ Check all three database IDs are set in environment variables  
→ Make sure you're using `ISSUES_DB_ID` (not `TICKETS_DB_ID`)

### "Could not find database"
→ Ensure each database is shared with your Notion integration  
→ Try both ID formats (with/without dashes)

### Empty epics or tickets arrays
→ Verify Issues have both Sprint AND Epic relations filled in  
→ Check that relation IDs match actual database entries

### "Cannot read property 'relation' of undefined"
→ Property names in Notion might not match exactly  
→ Check the property names in your databases

### Works locally but not on Vercel
→ Add all environment variables to Vercel  
→ **Redeploy** after adding variables (very important!)

---

## How It Works

1. **Fetches all three databases** from Notion API simultaneously
2. **Processes Issues**: Groups them by Sprint and Epic using their relations
3. **Builds hierarchy**:
   - For each Sprint → Find all Issues with that Sprint relation
   - For each Epic → Find all Issues with that Epic relation
   - Combine to create Sprint → Epic → Ticket structure
4. **Returns JSON** with the complete nested hierarchy

---

## Caching

The endpoint caches responses until **midnight PST** for optimal performance:
- First request after midnight: Fresh data from Notion
- Subsequent requests: Served from Vercel's edge cache (fast!)
- Automatic refresh: Cache expires daily at midnight PST

This reduces Notion API rate limits and improves response times.

---

## Quick Commands

```bash
# Test locally
node api/notion/test-sprints.js

# Deploy to Vercel
git add .
git commit -m "[Feature] - Add sprint management endpoint"
git push

# Test production
curl "https://your-domain.vercel.app/api/notion/sprints?projectSlug=CodeLens"
```

---

## Need Help?

1. **Check your Notion structure**: Issues must have BOTH Sprint and Epic relations
2. **Verify database IDs**: Use the correct IDs from your database URLs
3. **Test locally first**: Always test with `test-sprints.js` before deploying
4. **Check integration access**: All three databases must be shared with your integration

---

That's it! Your sprint management API is ready to use. 🚀
