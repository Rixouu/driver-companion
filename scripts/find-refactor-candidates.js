#!/usr/bin/env node

/**
 * Script to find potential refactor candidates for the new error handling utilities
 * 
 * Usage:
 * node scripts/find-refactor-candidates.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Target directories to scan
const dirsToScan = [
  'app',
  'components',
  'hooks',
  'lib'
];

// File extensions to check
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to look for
const patterns = [
  {
    name: 'Basic try/catch blocks',
    grep: 'try\\s*{[\\s\\S]*?}\\s*catch\\s*\\([^)]*?\\)\\s*{',
    refactorTo: 'withErrorHandling'
  },
  {
    name: 'Console.error in catch blocks',
    grep: 'catch[\\s\\S]*?console\\.error',
    refactorTo: 'handleError'
  },
  {
    name: 'Toast in catch blocks',
    grep: 'catch[\\s\\S]*?toast\\(',
    refactorTo: 'handleError with toast integration'
  },
  {
    name: 'setState in try/catch',
    grep: 'try[\\s\\S]*?set[A-Z][a-zA-Z]*\\([\\s\\S]*?catch[\\s\\S]*?set[A-Z][a-zA-Z]*\\(',
    refactorTo: 'useAsync hook'
  },
  {
    name: 'API response errors',
    grep: 'return\\s+(Response|NextResponse)',
    refactorTo: 'createApiErrorResponse or withApiErrorHandling'
  },
  {
    name: 'setInterval for polling',
    grep: 'setInterval[\\s\\S]*?from[\\s\\S]*?select',
    refactorTo: 'useRealtimeData or useRealtimeRecord'
  }
];

// Result object to store findings
const results = {
  totalFiles: 0,
  totalMatches: 0,
  patterns: {}
};

// Initialize pattern results
patterns.forEach(pattern => {
  results.patterns[pattern.name] = {
    count: 0,
    files: []
  };
});

/**
 * Check if a file should be scanned based on its extension
 */
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return extensions.includes(ext);
}

/**
 * Scan a file for patterns
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.grep, 'g');
    const matches = content.match(regex);
    
    if (matches && matches.length > 0) {
      results.patterns[pattern.name].count += matches.length;
      results.totalMatches += matches.length;
      
      if (!results.patterns[pattern.name].files.includes(filePath)) {
        results.patterns[pattern.name].files.push(filePath);
      }
    }
  });
}

/**
 * Recursively scan a directory
 */
function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDirectory(fullPath);
      }
    } else if (shouldScanFile(fullPath)) {
      results.totalFiles++;
      scanFile(fullPath);
    }
  }
}

/**
 * Generate report and output to console and file
 */
function generateReport() {
  // Create report string
  let report = '# Error Handling Refactor Candidates\n\n';
  report += `Total files scanned: ${results.totalFiles}\n`;
  report += `Total refactor candidates found: ${results.totalMatches}\n\n`;
  
  // Add details for each pattern
  for (const [patternName, patternResult] of Object.entries(results.patterns)) {
    if (patternResult.count > 0) {
      const pattern = patterns.find(p => p.name === patternName);
      
      report += `## ${patternName}\n\n`;
      report += `**Refactor to:** ${pattern.refactorTo}\n\n`;
      report += `Found ${patternResult.count} instances in ${patternResult.files.length} files:\n\n`;
      
      patternResult.files.forEach(file => {
        const relativePath = path.relative(process.cwd(), file);
        report += `- \`${relativePath}\`\n`;
      });
      
      report += '\n';
    }
  }
  
  // Output to console
  console.log(report);
  
  // Write to file
  fs.writeFileSync('refactor-candidates.md', report);
  console.log('Report saved to refactor-candidates.md');
}

// Main execution
console.log('Scanning directories for refactor candidates...');

dirsToScan.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    scanDirectory(dirPath);
  }
});

generateReport(); 