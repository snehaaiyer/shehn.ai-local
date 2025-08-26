
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Validating React Setup...\n');

// Check package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✅ package.json exists');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check essential dependencies
  const essentialDeps = ['react', 'react-dom', 'react-router-dom', 'typescript'];
  essentialDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} is installed`);
    } else {
      console.log(`❌ ${dep} is missing`);
    }
  });
} else {
  console.log('❌ package.json missing');
}

// Check src directory structure
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  console.log('✅ src directory exists');
  
  const requiredFiles = [
    'App.tsx',
    'index.tsx',
    'setupTests.ts',
    'pages/WeddingPreferences.tsx',
    'services/cloudflare_ai_service.ts',
    'store/useAppStore.ts'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(srcPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
} else {
  console.log('❌ src directory missing');
}

// Check public directory
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  console.log('✅ public directory exists');
  
  const indexHtmlPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('✅ public/index.html exists');
  } else {
    console.log('❌ public/index.html missing');
  }
} else {
  console.log('❌ public directory missing');
}

console.log('\n🎯 Validation complete!');
console.log('\nTo start the React app:');
console.log('1. cd react-frontend');
console.log('2. npm start');
console.log('3. Open the webview or external URL');
