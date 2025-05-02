// Simple script to diagnose translation issues
const fs = require('fs');
const path = require('path');

// Read the current translations
const enContent = fs.readFileSync('./lib/i18n/locales/en.ts', 'utf8');
const jaContent = fs.readFileSync('./lib/i18n/locales/ja.ts', 'utf8');

// Very basic "parser" to extract the exported object
function extractTranslationObject(content) {
  // Extract the part between the first curly brace and the last curly brace
  const match = content.match(/export const [a-z]+: [a-zA-Z]+ = ({[\s\S]*})/);
  if (!match || !match[1]) return {};
  
  try {
    // This is a hacky way to evaluate the code - in a real app, you would use a proper TS parser
    // Using eval is generally not recommended, but for this diagnostic script it's acceptable
    const objStr = match[1]
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Convert all keys to double-quoted strings
      .replace(/'/g, '"'); // Replace single quotes with double quotes
    return JSON.parse(objStr);
  } catch (e) {
    console.error('Error parsing translation file:', e);
    return {};
  }
}

// Just look for certain known patterns instead of parsing the whole file
function findProblematicKeys(content) {
  const problems = [];
  
  // Search for "notifications.toggle" and surrounding context
  const notificationsMatch = content.match(/notifications:\s*{[\s\S]*?toggle:\s*([^,}]+)/);
  if (notificationsMatch && notificationsMatch[1] && notificationsMatch[1].includes('{')) {
    problems.push('notifications.toggle appears to be an object instead of a string');
  }
  
  // Search for "drivers.tabs" and surrounding context
  const tabsMatch = content.match(/drivers:[\s\S]*?tabs:\s*{[\s\S]*?}/);
  if (tabsMatch) {
    const tabsContent = tabsMatch[0];
    // Check for overview
    if (tabsContent.match(/overview:\s*{/)) {
      problems.push('drivers.tabs.overview appears to be an object instead of a string');
    }
    // Check for activity
    if (tabsContent.match(/activity:\s*{/)) {
      problems.push('drivers.tabs.activity appears to be an object instead of a string');
    }
    // Check for inspections
    if (tabsContent.match(/inspections:\s*{/)) {
      problems.push('drivers.tabs.inspections appears to be an object instead of a string');
    }
    // Check for availability
    if (tabsContent.match(/availability:\s*{/)) {
      problems.push('drivers.tabs.availability appears to be an object instead of a string');
    }
  }
  
  // Search for "drivers.fields" issues
  const fieldsMatch = content.match(/drivers:[\s\S]*?fields:\s*{[\s\S]*?}/);
  if (fieldsMatch) {
    const fieldsContent = fieldsMatch[0];
    // Check for email
    if (fieldsContent.match(/email:\s*{/)) {
      problems.push('drivers.fields.email appears to be an object instead of a string');
    }
    // Check for phone
    if (fieldsContent.match(/phone:\s*{/)) {
      problems.push('drivers.fields.phone appears to be an object instead of a string');
    }
    // Check for licenseNumber
    if (fieldsContent.match(/licenseNumber:\s*{/)) {
      problems.push('drivers.fields.licenseNumber appears to be an object instead of a string');
    }
  }
  
  return problems;
}

// Check for structural problems in the files
const enProblems = findProblematicKeys(enContent);
const jaProblems = findProblematicKeys(jaContent);

console.log('English Translation Issues:');
if (enProblems.length > 0) {
  enProblems.forEach(problem => console.log(`  ${problem}`));
} else {
  console.log('  No obvious issues found!');
}

console.log('\nJapanese Translation Issues:');
if (jaProblems.length > 0) {
  jaProblems.forEach(problem => console.log(`  ${problem}`));
} else {
  console.log('  No obvious issues found!');
} 