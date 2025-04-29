const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to process a file
function processFile(filePath) {
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for Link components with multiple children
    const linkRegex = /<Link.*?>[^<]*(<[^>]*>[^<]*<\/[^>]*>)[^<]*<\/Link>/gs;
    const matches = content.match(linkRegex);
    
    if (!matches) {
      return false;
    }
    
    console.log(`Processing: ${filePath}`);
    
    let newContent = content;
    
    // Process each Link component
    matches.forEach(match => {
      // Check if there are multiple elements inside the Link
      const innerContent = match.match(/<Link.*?>([^<]*(?:<[^>]*>[^<]*<\/[^>]*>)[^<]*)<\/Link>/s);
      
      if (innerContent && innerContent[1]) {
        const inner = innerContent[1].trim();
        
        // If there's text content mixed with elements, wrap everything in a span
        if (inner.match(/[^\s<>]/) && inner.match(/<[^>]*>/)) {
          const newLink = match.replace(
            /<Link(.*?)>(.*?)<\/Link>/s,
            '<Link$1><span className="flex items-center gap-2">$2</span></Link>'
          );
          
          newContent = newContent.replace(match, newLink);
        }
      }
    });
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Find all TypeScript/JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'fix-*.js']
});

let modifiedCount = 0;

// Process each file
files.forEach(file => {
  const fullPath = path.resolve(file);
  const modified = processFile(fullPath);
  if (modified) {
    modifiedCount++;
  }
});

console.log(`Modified ${modifiedCount} files to fix Link components with multiple children.`); 