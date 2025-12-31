#!/usr/bin/env node

/**
 * Twitch OAuth Token Generator
 * 
 * This script generates an OAuth token using Client ID and Client Secret
 * from your Twitch application.
 * 
 * Usage:
 *   node scripts/generate-token.js
 * 
 * Or set environment variables:
 *   TWITCH_CLIENT_ID=your_client_id \
 *   TWITCH_CLIENT_SECRET=your_client_secret \
 *   node scripts/generate-token.js
 */

const readline = require('readline');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function generateToken() {
  console.log('Twitch OAuth Token Generator');
  console.log('============================\n');

  // Get Client ID
  let clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    clientId = await question('Enter your Twitch Client ID: ');
  }

  // Get Client Secret
  let clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientSecret) {
    clientSecret = await question('Enter your Twitch Client Secret: ');
  }

  console.log('\nGenerating OAuth token...\n');

  // Generate token using Client Credentials flow
  // Note: For IRC chat, we need a user token, not an app token
  // This script will guide you through the OAuth2 authorization code flow

  console.log('For IRC chat access, you need a USER OAuth token.');
  console.log('Follow these steps:\n');

  console.log('1. Open this URL in your browser:');
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=http://localhost&response_type=code&scope=chat:read`;
  console.log(`   ${authUrl}\n`);

  console.log('2. Authorize the application');
  console.log('3. You will be redirected to: http://localhost?code=AUTHORIZATION_CODE');
  console.log('4. Copy the "code" parameter from the URL\n');

  const authCode = await question('Paste the authorization code here: ');

  // Exchange authorization code for token
  const tokenData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: authCode,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost',
  });

  const options = {
    hostname: 'id.twitch.tv',
    path: '/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': tokenData.toString().length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            const accessToken = response.access_token;
            console.log('\n✅ Token generated successfully!\n');
            console.log('Add this to your .env file:');
            console.log(`TWITCH_OAUTH_TOKEN=oauth:${accessToken}\n`);
            console.log('Note: This token will expire. For production, implement token refresh.');
            resolve(accessToken);
          } catch (error) {
            console.error('Failed to parse response:', error);
            console.error('Response:', data);
            reject(error);
          }
        } else {
          console.error('Failed to generate token');
          console.error('Status:', res.statusCode);
          console.error('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(tokenData.toString());
    req.end();
  });
}

// Run the script
generateToken()
  .then(() => {
    rl.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  });


