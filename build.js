// Simple build script for Vercel
const fs = require('fs');
const path = require('path');

console.log('Building Jersey OMS for production...');

// Ensure all static files are accessible
const staticFiles = [
  'index.html',
  'orders.html', 
  'customers.html',
  
  'reports.html',
  'settings.html',
  'client.html',
  'order.html',
  'offline.html',
  'styles.css',
  'script.js',
  'sw.js'
];

// Check if files exist
staticFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} found`);
  } else {
    console.log(`✗ ${file} missing`);
  }
});

// Check JS directory
const jsDir = 'js';
if (fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir);
  console.log(`✓ JS directory found with ${jsFiles.length} files`);
  jsFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
}

// Check public directory
const publicDir = 'public';
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  console.log(`✓ Public directory found with ${publicFiles.length} files`);
}

console.log('Build completed successfully!');
