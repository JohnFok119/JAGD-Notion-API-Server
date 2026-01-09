/**
 * Test Notion API Connection Locally
 * Run with: npm test
 */

const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

console.log('🔍 Testing Notion API Connection...\n');

if (!API_KEY) {
  console.error('❌ NOTION_API_KEY not found in .env.local');
  process.exit(1);
}

if (!DATABASE_ID) {
  console.error('❌ NOTION_DATABASE_ID not found in .env.local');
  process.exit(1);
}

console.log('✅ API Key found');
console.log('✅ Database ID found\n');

const notion = new Client({ auth: API_KEY });

(async () => {
  try {
    console.log('📡 Connecting to Notion...\n');
    
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    console.log(`✅ SUCCESS! Found ${response.results.length} items\n`);

    response.results.forEach((page, index) => {
      const props = page.properties;
      console.log(`${index + 1}. ${props.Name?.title?.[0]?.plain_text || 'Untitled'}`);
      console.log(`   Project: ${props.Project?.rich_text?.[0]?.plain_text || 'N/A'}`);
      console.log(`   Phase: ${props.Phase?.select?.name || 'N/A'}`);
      console.log(`   Status: ${props.Status?.select?.name || 'N/A'}\n`);
    });

    console.log('🎉 Connection test successful!\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
})();

