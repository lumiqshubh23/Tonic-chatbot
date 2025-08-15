#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables to optimize development server
process.env.CHOKIDAR_USEPOLLING = 'true';
process.env.CHOKIDAR_INTERVAL = '2000';
process.env.FAST_REFRESH = 'false';
process.env.GENERATE_SOURCEMAP = 'false';

console.log('🚀 Starting React development server with optimized settings...');
console.log('📝 Hot Module Replacement optimized for reduced API calls');
console.log('⏱️  File watching interval: 2000ms');
console.log('🔄 Fast Refresh: Disabled');

// Start the React development server
const child = spawn('react-scripts', ['start'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    CHOKIDAR_USEPOLLING: 'true',
    CHOKIDAR_INTERVAL: '2000',
    FAST_REFRESH: 'false',
    GENERATE_SOURCEMAP: 'false',
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`\n👋 Development server stopped with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping development server...');
  child.kill('SIGTERM');
});
