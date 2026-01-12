const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing LeetCode API Connection...\n');

(async () => {
  try {
    // Test 1: Health check
    console.log('1️⃣  Testing /api/leetcode/test');
    const testRes = await fetch('http://localhost:3000/api/leetcode/test');
    const testData = await testRes.json();
    console.log(testData.success ? '✅ PASS' : '❌ FAIL', testData.message);

    // Test 2: Stats
    console.log('\n2️⃣  Testing /api/leetcode/stats');
    const statsRes = await fetch('http://localhost:3000/api/leetcode/stats?username=giuseppi');
    const statsData = await statsRes.json();
    console.log(statsData.success ? '✅ PASS' : '❌ FAIL');
    if (statsData.success) {
      console.log(`   Total solved: ${statsData.data.totalSolved}`);
      console.log(`   Recent submissions: ${statsData.data.recentSubmissions.length} days`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();
