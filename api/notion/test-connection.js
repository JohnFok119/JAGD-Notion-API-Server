/**
 * Test Notion API Connection Locally
 * Run with: npm test
 */

const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

// Load environment variables (try .env first, then .env.local)
dotenv.config();

const API_KEY = process.env.NOTION_API_KEY;

console.log('🔍 Testing Notion API Connection...\n');

if (!API_KEY) {
  console.error('❌ NOTION_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ API Key found\n');

const notion = new Client({ auth: API_KEY });

(async () => {
  try {
    console.log('📡 Connecting to Notion workspace...\n');
    
    // Test connection by getting bot info
    const botInfo = await notion.users.me();

    console.log('✅ SUCCESS! Connected to Notion workspace\n');
    console.log(`🤖 Bot Name: ${botInfo.name || 'Integration'}`);
    console.log(`🔗 Type: ${botInfo.type}`);
    console.log(`✓ Workspace access confirmed\n`);

    // Test all three sprint databases
    console.log('='.repeat(60));
    console.log('📊 Testing Sprint Management Databases...\n');

    const SPRINTS_DB_ID = process.env.NOTION_CODELENS_SPRINTS_DB_ID;
    const EPICS_DB_ID = process.env.NOTION_CODELENS_EPICS_DB_ID;
    const ISSUES_DB_ID = process.env.NOTION_CODELENS_ISSUES_DB_ID;

    let allTestsPassed = true;

    // Test Sprints Database
    if (SPRINTS_DB_ID) {
      try {
        console.log('⏳ Testing Sprints database...');
        const sprintsResponse = await notion.databases.query({
          database_id: SPRINTS_DB_ID,
        });
        console.log(`✅ Sprints: Found ${sprintsResponse.results.length} items`);
        
        // Show first sprint
        if (sprintsResponse.results.length > 0) {
          const sprint = sprintsResponse.results[0];
          const name = sprint.properties.Name?.title?.[0]?.plain_text || 'Untitled';
          console.log(`   → Example: "${name}"`);
        }
        console.log('');
      } catch (error) {
        console.error(`❌ Sprints database error: ${error.message}\n`);
        allTestsPassed = false;
      }
    } else {
      console.log('⚠️  Sprints: NOTION_CODELENS_SPRINTS_DB_ID not set\n');
      allTestsPassed = false;
    }

    // Test Epics Database
    if (EPICS_DB_ID) {
      try {
        console.log('⏳ Testing Epics database...');
        const epicsResponse = await notion.databases.query({
          database_id: EPICS_DB_ID,
        });
        console.log(`✅ Epics: Found ${epicsResponse.results.length} items`);
        
        // Show first epic
        if (epicsResponse.results.length > 0) {
          const epic = epicsResponse.results[0];
          const name = epic.properties.Name?.title?.[0]?.plain_text || 'Untitled';
          console.log(`   → Example: "${name}"`);
        }
        console.log('');
      } catch (error) {
        console.error(`❌ Epics database error: ${error.message}\n`);
        allTestsPassed = false;
      }
    } else {
      console.log('⚠️  Epics: NOTION_CODELENS_EPICS_DB_ID not set\n');
      allTestsPassed = false;
    }

    // Test Issues Database
    if (ISSUES_DB_ID) {
      try {
        console.log('⏳ Testing Issues database...');
        const issuesResponse = await notion.databases.query({
          database_id: ISSUES_DB_ID,
        });
        console.log(`✅ Issues: Found ${issuesResponse.results.length} items`);
        
        // Show first issue
        if (issuesResponse.results.length > 0) {
          const issue = issuesResponse.results[0];
          const name = issue.properties.Issue?.title?.[0]?.plain_text || 
                       issue.properties.Name?.title?.[0]?.plain_text || 'Untitled';
          console.log(`   → Example: "${name}"`);
        }
        console.log('');
      } catch (error) {
        console.error(`❌ Issues database error: ${error.message}\n`);
        allTestsPassed = false;
      }
    } else {
      console.log('⚠️  Issues: NOTION_CODELENS_ISSUES_DB_ID not set\n');
      allTestsPassed = false;
    }

    console.log('='.repeat(60));
    
    if (allTestsPassed) {
      console.log('\n🎉 All tests passed! Ready to use /api/notion/sprints endpoint\n');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
})();

