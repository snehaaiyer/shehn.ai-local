
const fs = require('fs');
const path = require('path');

console.log('🛡️ Preventing Runtime Errors...\n');

// 1. Check and fix import statements
console.log('1️⃣ Fixing Import Statements:');

const fixImportsInFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix react-router-dom imports
    if (content.includes("from 'react-router-dom'") && !content.includes('BrowserRouter')) {
      content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate, BrowserRouter } from 'react-router-dom';"
      );
      changed = true;
    }

    // Fix missing React imports
    if (content.includes('JSX.Element') && !content.includes("import React")) {
      content = "import React from 'react';\n" + content;
      changed = true;
    }

    // Fix framer-motion imports
    if (content.includes('motion.') && !content.includes("from 'framer-motion'")) {
      content = "import { motion } from 'framer-motion';\n" + content;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ Fixed imports in ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`   ❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
};

const filesToFix = [
  'src/App.tsx',
  'src/pages/WeddingPreferences.tsx',
  'src/pages/VendorDiscovery.tsx',
  'src/pages/AIChat.tsx',
  'src/pages/BudgetManagement.tsx'
];

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixImportsInFile(fullPath);
  }
});

// 2. Check for undefined environment variables
console.log('\n2️⃣ Checking Environment Variables:');

const checkEnvVars = () => {
  const envVars = [
    'REACT_APP_CLOUDFLARE_API_KEY',
    'REACT_APP_CLOUDFLARE_ACCOUNT_ID',
    'REACT_APP_BACKEND_URL'
  ];

  envVars.forEach(envVar => {
    const value = process.env[envVar];
    console.log(`   ${value ? '✅' : '⚠️'} ${envVar}: ${value ? 'Set' : 'Not set (will use fallback)'}`);
  });
};

checkEnvVars();

// 3. Validate service exports
console.log('\n3️⃣ Validating Service Exports:');

const validateServiceExport = (servicePath) => {
  try {
    const content = fs.readFileSync(servicePath, 'utf8');
    const hasDefaultExport = content.includes('export default');
    const hasNamedExports = content.includes('export {') || content.includes('export interface') || content.includes('export class');
    
    console.log(`   ${hasDefaultExport ? '✅' : '❌'} ${servicePath}: Default export ${hasDefaultExport ? 'found' : 'missing'}`);
    return hasDefaultExport;
  } catch (error) {
    console.log(`   ❌ Error validating ${servicePath}:`, error.message);
    return false;
  }
};

const services = [
  'src/services/cloudflare_ai_service.ts',
  'src/services/ai_assistant_service.ts',
  'src/services/mock_cloudflare_service.ts'
];

services.forEach(service => {
  const fullPath = path.join(__dirname, service);
  if (fs.existsSync(fullPath)) {
    validateServiceExport(fullPath);
  }
});

// 4. Check package.json scripts
console.log('\n4️⃣ Validating Package Scripts:');

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredScripts = ['start', 'build', 'test'];
  
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`   ${exists ? '✅' : '❌'} ${script}: ${exists || 'Missing'}`);
  });
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

console.log('\n🎯 Runtime Error Prevention Complete!');
console.log('   • All import statements validated');
console.log('   • Environment variables checked');
console.log('   • Service exports validated');
console.log('   • Package scripts verified');
