const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'fix-*.js']
});

let modifiedCount = 0;

// Process each file
files.forEach(file => {
  const filePath = path.resolve(file);
  
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't have legacyBehavior
    if (!content.includes('legacyBehavior')) {
      return;
    }
    
    console.log(`Processing: ${filePath}`);
    
    // Simply remove legacyBehavior from all Link components
    const newContent = content.replace(/\s*legacyBehavior\s*/g, ' ');
    
    // Write the file back if changes were made
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modifiedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log(`Modified ${modifiedCount} files to remove legacyBehavior.`); 