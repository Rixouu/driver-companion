#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Default content for .env.local file
const envContent = `# WordPress API Configuration
NEXT_PUBLIC_WORDPRESS_API_URL=http://your-wordpress-site.com
NEXT_PUBLIC_WORDPRESS_API_KEY=your-api-key
NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=wp-json/driver/v1/bookings

# Uncomment and set these values for server-side only access (more secure)
# WORDPRESS_API_URL=http://your-wordpress-site.com
# WORDPRESS_API_KEY=your-api-key
# WORDPRESS_API_CUSTOM_PATH=wp-json/driver/v1/bookings
`;

// Path to .env.local file
const envPath = path.join(process.cwd(), '.env.local');

// Create the file if it doesn't exist
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('\x1b[32m%s\x1b[0m', '✅ Created .env.local file with WordPress API configuration');
} else {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ .env.local file already exists, skipping creation');
  console.log('To configure WordPress API, add the following to your .env.local:');
  console.log('\x1b[36m%s\x1b[0m', envContent);
}

// Additional instructions
console.log('\x1b[1m%s\x1b[0m', '\nIMPORTANT: Replace the placeholder values with your actual WordPress API details');
console.log('After setting up your .env.local file, restart your development server'); 