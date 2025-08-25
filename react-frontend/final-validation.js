
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 FINAL COMPREHENSIVE VALIDATION\n');

const tests = [
  {
    name: 'Dependencies Installation',
    command: 'npm',
    args: ['list', '--depth=0'],
    timeout: 30000
  },
  {
    name: 'TypeScript Compilation',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    timeout: 30000
  },
  {
    name: 'Jest Tests',
    command: 'npm',
    args: ['test', '--', '--watchAll=false', '--coverage=false'],
    timeout: 60000
  },
  {
    name: 'Build Process',
    command: 'npm',
    args: ['run', 'build'],
    timeout: 120000
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`🧪 Running: ${test.name}...`);
    
    const child = spawn(test.command, test.args, {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      resolve({
        name: test.name,
        success: false,
        error: 'Test timed out',
        output: output,
        errorOutput: errorOutput
      });
    }, test.timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        name: test.name,
        success: code === 0,
        code: code,
        output: output,
        errorOutput: errorOutput
      });
    });
  });
}

async function runAllTests() {
  console.log('Starting comprehensive validation...\n');
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    
    if (result.success) {
      console.log(`   ✅ ${result.name}: PASSED`);
    } else {
      console.log(`   ❌ ${result.name}: FAILED`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      if (result.errorOutput && result.errorOutput.length > 0) {
        console.log(`      Details: ${result.errorOutput.substring(0, 200)}...`);
      }
    }
  }
  
  console.log('\n📊 FINAL RESULTS:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! NO RUNTIME ERRORS DETECTED!');
    console.log('   • Dependencies installed correctly');
    console.log('   • TypeScript compiles without errors');
    console.log('   • All tests pass');
    console.log('   • Build process succeeds');
    console.log('\n✨ Ready for production deployment!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED. Issues found:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.name}: ${result.error || 'Check logs above'}`);
    });
  }
  
  return passed === total;
}

// Run the comprehensive validation
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Validation failed with error:', error);
  process.exit(1);
});
