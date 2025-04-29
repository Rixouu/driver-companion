const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to process a file
function processFile(filePath) {
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains legacyBehavior
    if (!content.includes('legacyBehavior')) {
      return false;
    }
    
    console.log(`Processing: ${filePath}`);
    
    // Use regex to find all Link elements with legacyBehavior
    const linkRegex = /<Link[\s\S]*?legacyBehavior[\s\S]*?<\/Link>/g;
    const matches = content.match(linkRegex);
    
    if (!matches) {
      return false;
    }
    
    let modifiedContent = content;
    
    for (const match of matches) {
      let replacement = match;
      
      // Extract href attribute
      const hrefMatch = match.match(/href=(['"])(.*?)\1/);
      if (!hrefMatch) continue;
      
      // Extract className if present
      let className = '';
      const classNameMatch = match.match(/className=(['"])(.*?)\1/);
      if (classNameMatch) {
        className = classNameMatch[2];
      }
      
      // Remove legacyBehavior
      replacement = replacement.replace(/\s*legacyBehavior\s*/, ' ');
      
      // Check if Link has multiple children or a single element
      if (/<Link[\s\S]*?>[\s\S]*?<[a-zA-Z][^>]*>[\s\S]*?<\/[a-zA-Z][^>]*>[\s\S]*?[^<>]+[\s\S]*?<\/Link>/i.test(match) ||
          /<Link[\s\S]*?>[\s\S]*?[^<>]+[\s\S]*?<[a-zA-Z][^>]*>[\s\S]*?<\/[a-zA-Z][^>]*>[\s\S]*?<\/Link>/i.test(match)) {
        // Extract the content between opening and closing Link tags
        const contentBetweenTags = match.match(/<Link[\s\S]*?>([\s\S]*?)<\/Link>/);
        if (contentBetweenTags && contentBetweenTags[1]) {
          const innerContent = contentBetweenTags[1].trim();
          
          // Create a new replacement with a span wrapper
          replacement = match.replace(
            /<Link([\s\S]*?)>([\s\S]*?)<\/Link>/,
            `<Link$1><span className="flex items-center gap-2">$2</span></Link>`
          );
        }
      }
      
      // Apply the replacement
      modifiedContent = modifiedContent.replace(match, replacement);
    }
    
    if (modifiedContent !== content) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
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
  ignore: ['node_modules/**', '.next/**', 'fix-legacy-behavior*.js']
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