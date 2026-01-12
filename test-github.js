const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing GitHub API Connection...\n');

(async () => {
  try {
    // Test 1: Health check
    console.log('1️⃣  Testing /api/github/test');
    const testRes = await fetch('http://localhost:3000/api/github/test');
    const testData = await testRes.json();
    console.log(testData.success ? '✅ PASS' : '❌ FAIL', testData.message);

    // Test 2: Contributions
    console.log('\n2️⃣  Testing /api/github/contributions');
    const contribRes = await fetch('http://localhost:3000/api/github/contributions?username=giuseppi');
    const contribData = await contribRes.json();
    console.log(contribData.success ? '✅ PASS' : '❌ FAIL');
    if (contribData.success) {
      console.log(`   Found ${contribData.data.length} contribution days`);
    }

    // Test 3: Commits
    console.log('\n3️⃣  Testing /api/github/commits');
    const commitsRes = await fetch('http://localhost:3000/api/github/commits?repo=jagdteam/clicr');
    const commitsData = await commitsRes.json();
    console.log(commitsData.success ? '✅ PASS' : '❌ FAIL');
    if (commitsData.success) {
      console.log(`   Found ${commitsData.data.length} team commits`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();
