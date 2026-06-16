const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building @depot/shared...');

// Clean dist directory
if (fs.existsSync('./dist')) {
  fs.rmSync('./dist', { recursive: true });
}

// Build CommonJS version
console.log('Building CommonJS version...');
execSync('npx tsc', { stdio: 'inherit' });

// Build ES modules version
console.log('Building ES modules version...');
execSync('npx tsc --module ES2022 --outDir ./dist-esm', { stdio: 'inherit' });

// Bundle CommonJS into single file
console.log('Bundling CommonJS...');
const files = ['types.js', 'requests.js', 'functions.js'];
let bundled = `"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });

`;

files.forEach((file) => {
  const filePath = path.join('./dist', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = content
      .replace(/^"use strict";\s*/, '')
      .replace(/var __createBinding[^;]*;\s*/, '')
      .replace(/var __exportStar[^;]*;\s*/, '')
      .replace(
        /Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);\s*/,
        ''
      );

    bundled += cleaned + '\n';
  }
});

fs.writeFileSync(path.join('./dist', 'index.js'), bundled);

// Copy ES module files and create ESM index
console.log('Creating ES modules...');
files.forEach((file) => {
  const srcPath = path.join('./dist-esm', file);
  const destPath = path.join('./dist', file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
});

const esmContent = `export * from './types.js';
export * from './requests.js';
export * from './functions.js';`;

fs.writeFileSync(path.join('./dist', 'index.esm.js'), esmContent);

// Clean up temporary directory
fs.rmSync('./dist-esm', { recursive: true });

console.log('Build complete!');
