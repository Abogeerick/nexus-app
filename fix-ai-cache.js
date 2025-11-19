/**
 * Script to clear corrupted Transformers.js model cache
 * Run with: node fix-ai-cache.js
 */

const fs = require('fs');
const path = require('path');

// Hugging Face cache locations
const cacheLocations = [
  path.join(process.env.USERPROFILE || process.env.HOME, '.cache', 'huggingface'),
  path.join(process.env.LOCALAPPDATA || '', 'huggingface'),
  path.join(process.cwd(), 'node_modules', '@xenova', 'transformers', '.cache'),
];

console.log('🔧 Fixing Corrupted AI Model Cache');
console.log('=' .repeat(60));
console.log('');

let clearedSomething = false;

for (const cacheDir of cacheLocations) {
  if (!cacheDir) continue;
  
  console.log(`📂 Checking: ${cacheDir}`);
  
  if (fs.existsSync(cacheDir)) {
    try {
      console.log(`   Found cache directory`);
      console.log(`   Removing corrupted files...`);
      
      // Remove the directory recursively
      fs.rmSync(cacheDir, { recursive: true, force: true });
      
      console.log(`   ✅ Cleared successfully`);
      clearedSomething = true;
    } catch (error) {
      console.log(`   ⚠️  Could not clear: ${error.message}`);
    }
  } else {
    console.log(`   Not found (OK)`);
  }
  console.log('');
}

if (clearedSomething) {
  console.log('=' .repeat(60));
  console.log('✅ Cache cleared successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Restart your Next.js development server');
  console.log('2. Upload a transaction PDF');
  console.log('3. The AI model will download fresh (20-30 seconds)');
  console.log('4. Subsequent imports will be fast!');
  console.log('');
} else {
  console.log('=' .repeat(60));
  console.log('ℹ️  No cache found to clear');
  console.log('');
  console.log('The model will download on first use.');
  console.log('');
}

console.log('💡 Tip: Make sure you have a good internet connection');
console.log('💡 Model size: ~50-100MB');
console.log('');


