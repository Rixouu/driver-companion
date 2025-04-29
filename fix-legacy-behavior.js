const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to process a file
function processFile(filePath) {
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains legacyBehavior
    if (!content.includes('legacyBehavior')) {
      return false;
    }
    
    console.log(`Processing: ${filePath}`);
    
    // Replace pattern 1: simple legacyBehavior with multiple direct children
    content = content.replace(
      /<Link([^>]*?)href=(["|'])([^"']+)\2([^>]*?)legacyBehavior>\s*<([^>]+)([^<]*)<\/[^>]+>\s*([^<]+)\s*<\/Link>/g,
      '<Link$1href=$2$3$2$4><span className="flex items-center">$5$6$7</span></Link>'
    );
    
    // Replace pattern 2: legacyBehavior with a single element
    content = content.replace(
      /<Link([^>]*?)href=(["|'])([^"']+)\2([^>]*?)legacyBehavior>\s*<([^>]+)([^<]*)<\/[^>]+>\s*<\/Link>/g,
      '<Link$1href=$2$3$2$4><$5$6</$5></Link>'
    );
    
    // Replace pattern 3: simple legacyBehavior with text only
    content = content.replace(
      /<Link([^>]*?)href=(["|'])([^"']+)\2([^>]*?)legacyBehavior>\s*([^<]+)\s*<\/Link>/g,
      '<Link$1href=$2$3$2$4><span>$5</span></Link>'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Find all TypeScript/JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'fix-legacy-behavior.js']
});

let modifiedFiles = 0;

// Process each file
files.forEach(file => {
  const fullPath = path.resolve(file);
  const modified = processFile(fullPath);
  if (modified) {
    modifiedFiles++;
  }
});

console.log(`Processed ${files.length} files, fixed legacyBehavior in ${modifiedFiles} files.`); 