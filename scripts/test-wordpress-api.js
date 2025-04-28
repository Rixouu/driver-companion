#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Load environment variables from .env.local file if it exists
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  console.log('Loaded environment variables from .env.local');
} else {
  console.log('No .env.local file found, using process environment');
}

// Get API URL from environment
const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || '';
const apiKey = process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || '';
const customPath = process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH || '';

if (!apiUrl) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: NEXT_PUBLIC_WORDPRESS_API_URL is not set.');
  console.log('Please run npm run setup-env to create a template .env.local file and set your WordPress API URL.');
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '🔍 WordPress API Connection Test');
console.log('API URL:', apiUrl);
console.log('Custom Path:', customPath || '(not set)');
console.log('API Key:', apiKey ? '✓ Set' : '(not set)');

if (!apiKey) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️ Warning: No API key set. WordPress API might require authentication.');
}

// Try different endpoint combinations
const endpoints = [
  `${apiUrl}/wp-json/driver/v1/bookings`,
  customPath ? `${apiUrl}${customPath.startsWith('/') ? '' : '/'}${customPath}` : null,
  `${apiUrl}/bookings`,
  `${apiUrl}/wp-json`,  // Check if WordPress REST API is available
].filter(Boolean);

console.log('\n\x1b[36m%s\x1b[0m', '🧪 Testing endpoints...');

// Try different authentication methods
const authMethods = [
  apiKey ? { name: 'Bearer token', headers: `-H "Authorization: Bearer ${apiKey}"` } : null,
  apiKey ? { name: 'Basic auth', headers: `-H "Authorization: Basic ${Buffer.from(`${apiKey}:`).toString('base64')}"` } : null,
  apiKey ? { name: 'API key as query param', headers: '', query: `?api_key=${apiKey}` } : null,
  { name: 'No auth', headers: '', query: '' }
].filter(Boolean);

// Function to test an endpoint with different auth methods
async function testEndpoint(url) {
  console.log(`\nTesting: ${url}`);
  
  for (const authMethod of authMethods) {
    console.log(`\nTrying ${authMethod.name}...`);
    try {
      const query = authMethod.query || '';
      const testUrl = `${url}${query}`;
      
      // Use curl for simplicity
      const command = `curl -s -o /dev/null -w "%{http_code}" ${authMethod.headers} "${testUrl}"`;
      const status = execSync(command).toString().trim();
      
      if (status === '200') {
        console.log('\x1b[32m%s\x1b[0m', `✅ Success (${status})! Endpoint is accessible with ${authMethod.name}.`);
        console.log('Now fetching data structure...');
        
        try {
          const dataCommand = `curl -s ${authMethod.headers} "${testUrl}${query ? '&' : '?'}limit=1"`;
          const data = execSync(dataCommand).toString();
          const parsedData = JSON.parse(data);
          
          console.log('\x1b[32m%s\x1b[0m', '✅ Successfully parsed JSON response');
          
          // Check for WordPress API structure
          if (parsedData.data && Array.isArray(parsedData.data)) {
            console.log('\x1b[32m%s\x1b[0m', '✅ Found WordPress API structure with data array');
            console.log('\x1b[32m%s\x1b[0m', '🎉 THIS IS THE CORRECT ENDPOINT & AUTH METHOD TO USE!');
            
            // Create or update .env.local with the correct settings
            const envContent = `NEXT_PUBLIC_WORDPRESS_API_URL=${apiUrl}
NEXT_PUBLIC_WORDPRESS_API_KEY=${apiKey}
NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=${url.replace(apiUrl, '').replace(/^\//, '')}
NEXT_PUBLIC_WORDPRESS_AUTH_METHOD=${authMethod.name === 'Bearer token' ? 'bearer' : authMethod.name === 'Basic auth' ? 'basic' : 'query'}
`;
            
            console.log('\n\x1b[36m%s\x1b[0m', '💾 Saving correct configuration to .env.local');
            fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
            console.log('\x1b[32m%s\x1b[0m', '✅ Configuration saved! Please restart your development server.');
            
            // Also create a sample request for debugging
            const sampleCommand = `curl -s ${authMethod.headers} "${testUrl}${query ? '&' : '?'}limit=10"`;
            fs.writeFileSync(path.join(process.cwd(), 'debug-request.txt'), 
              `Sample curl command that works:\n${sampleCommand}\n\nHeaders to include in fetch():\n${JSON.stringify({
                'Content-Type': 'application/json',
                ...(authMethod.name === 'Bearer token' ? { 'Authorization': `Bearer ${apiKey}` } : 
                   authMethod.name === 'Basic auth' ? { 'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}` } : {})
              }, null, 2)}`
            );
            
            return true;
          } else {
            console.log('Response structure:', Object.keys(parsedData));
          }
        } catch (e) {
          console.log('\x1b[33m%s\x1b[0m', `⚠️ Could not parse JSON response: ${e.message}`);
        }
      } else if (status === '401' || status === '403') {
        console.log('\x1b[33m%s\x1b[0m', `⚠️ Authentication error (${status}). This endpoint might require different credentials.`);
      } else {
        console.log('\x1b[33m%s\x1b[0m', `⚠️ Endpoint returned status ${status}`);
      }
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Error: ${error.message}`);
    }
  }
  return false;
}

// Test all endpoints
async function testAllEndpoints() {
  let success = false;
  
  for (const endpoint of endpoints) {
    success = await testEndpoint(endpoint);
    if (success) break;
  }
  
  if (!success) {
    console.log('\n\x1b[31m%s\x1b[0m', '❌ None of the tested endpoints worked properly.');
    console.log('Please check your WordPress API URL and ensure the Driver Companion plugin is properly installed.');
    console.log('You can try to add the correct API path by editing your .env.local file.');
    
    // Create debug script when nothing worked
    const debugEndpoint = `${apiUrl}/wp-json/driver/v1/bookings`;
    const debugCommand = `curl -v "${debugEndpoint}" -H "Authorization: Bearer ${apiKey}"`;
    fs.writeFileSync(path.join(process.cwd(), 'debug-request.txt'), 
      `Try this command to debug your WordPress API connection:\n${debugCommand}\n\n` +
      `If you get a 401 Unauthorized response, check your API key and authentication method.\n` +
      `If you get a 404 Not Found response, check that the endpoint path is correct.\n`
    );
    console.log('\n\x1b[36m%s\x1b[0m', '💡 A debug-request.txt file has been created with commands to help troubleshoot the API connection.');
  }
}

testAllEndpoints(); 