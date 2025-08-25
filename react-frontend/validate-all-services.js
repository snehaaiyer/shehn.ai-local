
const fs = require('fs');
const path = require('path');

console.log('🧪 Validating All React Services...\n');

// Test 1: Check if all required files exist
const requiredFiles = [
  'src/services/cloudflare_ai_service.ts',
  'src/services/mock_cloudflare_service.ts',
  'src/services/ai_assistant_service.ts',
  'src/App.tsx',
  'src/pages/WeddingPreferences.tsx',
  'babel.config.js',
  'package.json'
];

console.log('1️⃣ Checking Required Files:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Test 2: Check package.json for dependencies
console.log('\n2️⃣ Checking Dependencies:');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const requiredDeps = [
  'react',
  'react-dom',
  'react-router-dom',
  'typescript',
  'react-scripts',
  'framer-motion',
  'react-hot-toast',
  'clsx'
];

let allDepsPresent = true;
requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies && packageJson.dependencies[dep];
  console.log(`   ${exists ? '✅' : '❌'} ${dep}: ${exists || 'MISSING'}`);
  if (!exists) allDepsPresent = false;
});

// Test 3: Check for babel configuration
console.log('\n3️⃣ Checking Babel Configuration:');
const babelExists = fs.existsSync(path.join(__dirname, 'babel.config.js'));
console.log(`   ${babelExists ? '✅' : '❌'} babel.config.js exists`);

// Test 4: Validate TypeScript files syntax
console.log('\n4️⃣ Checking TypeScript Files:');
const tsFiles = [
  'src/services/cloudflare_ai_service.ts',
  'src/App.tsx',
  'src/pages/WeddingPreferences.tsx'
];

let allTsValid = true;
tsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const hasImports = content.includes('import');
    const hasExports = content.includes('export');
    const valid = hasImports && hasExports;
    console.log(`   ${valid ? '✅' : '❌'} ${file}: ${valid ? 'Valid TS structure' : 'Invalid structure'}`);
    if (!valid) allTsValid = false;
  } catch (error) {
    console.log(`   ❌ ${file}: Error reading file`);
    allTsValid = false;
  }
});

// Test 5: Check test files
console.log('\n5️⃣ Checking Test Files:');
const testFiles = [
  'src/__tests__/CloudflareAIService.test.tsx',
  'src/__tests__/App.test.tsx',
  'src/__tests__/WeddingPreferences.test.tsx'
];

let allTestsExist = true;
testFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allTestsExist = false;
});

// Summary
console.log('\n📊 VALIDATION SUMMARY:');
console.log(`   Files: ${allFilesExist ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Dependencies: ${allDepsPresent ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Babel Config: ${babelExists ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   TypeScript: ${allTsValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Tests: ${allTestsExist ? '✅ PASS' : '❌ FAIL'}`);

const overallPass = allFilesExist && allDepsPresent && babelExists && allTsValid && allTestsExist;
console.log(`\n🎯 OVERALL: ${overallPass ? '✅ ALL TESTS PASS' : '❌ TESTS FAILED'}`);

if (!overallPass) {
  console.log('\n🔧 RECOMMENDED FIXES:');
  if (!allFilesExist) console.log('   • Run: npm install');
  if (!allDepsPresent) console.log('   • Install missing dependencies');
  if (!babelExists) console.log('   • Babel config created');
  if (!allTsValid) console.log('   • Fix TypeScript syntax errors');
  if (!allTestsExist) console.log('   • Create missing test files');
}

process.exit(overallPass ? 0 : 1);
