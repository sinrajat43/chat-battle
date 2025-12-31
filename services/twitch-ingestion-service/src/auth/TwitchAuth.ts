import express from 'express';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { TokenData } from './types';

const TOKEN_STORE_PATH = path.join(__dirname, '../../tokenStore.json');

/**
 * TwitchAuth - Handles OAuth2 authentication and token refresh
 * 
 * This module provides:
 * - Express server for OAuth callback
 * - Token storage and retrieval
 * - Automatic token refresh
 * 
 * Usage:
 * 1. Run auth server: npm run auth
 * 2. Visit http://localhost:3000/auth to authorize
 * 3. Use getAccessToken() in your code to get valid tokens
 */

// Helper to save tokens
async function saveTokens(tokenData: any): Promise<void> {
  const { access_token, refresh_token, expires_in } = tokenData;
  const expiresAt = Date.now() + (expires_in * 1000);
  const data: TokenData = {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt,
  };
  await fs.writeFile(TOKEN_STORE_PATH, JSON.stringify(data, null, 2));
  logger.info('Tokens saved successfully.');
}

// Helper to load tokens
async function loadTokens(): Promise<TokenData | null> {
  try {
    const data = await fs.readFile(TOKEN_STORE_PATH, 'utf-8');
    return JSON.parse(data) as TokenData;
  } catch (error) {
    return null; // No token file exists
  }
}

/**
 * Gets a valid access token, refreshing it if necessary.
 * @returns The access token, or null if authentication is needed.
 */
export async function getAccessToken(): Promise<string | null> {
  let tokens = await loadTokens();

  if (!tokens) {
    logger.warn('No tokens found. Please run the auth server and authorize.');
    return null;
  }

  // Check if the token is expired or close to expiring (e.g., within the next minute)
  if (Date.now() >= tokens.expiresAt - 60000) {
    logger.info('Access token expired, refreshing...');
    
    // Check if Client ID and Secret are available for refresh
    if (!config.twitch.clientId || !config.twitch.clientSecret) {
      logger.error('Cannot refresh token: TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required for token refresh');
      return null;
    }
    
    try {
      // Twitch OAuth2 token refresh - using form-encoded body (OAuth2 standard)
      const refreshResponse = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: config.twitch.clientId,
          client_secret: config.twitch.clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      await saveTokens(refreshResponse.data);
      tokens = await loadTokens(); // Reload the new tokens
    } catch (error) {
      logger.error({ error }, 'Failed to refresh access token');
      return null;
    }
  }

  return tokens ? tokens.accessToken : null;
}

/**
 * Start the OAuth authentication server
 * This should be run separately for initial authentication
 */
export function startAuthServer(): void {
  // Validate Client ID and Secret are available
  if (!config.twitch.clientId || !config.twitch.clientSecret) {
    logger.error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required to start the auth server');
    process.exit(1);
  }

  const app = express();
  const port = config.twitch.authPort || 3000;

  // Root route - provide helpful message
  app.get('/', (_req, res) => {
    res.send(`
      <html>
        <head><title>Twitch OAuth Authentication</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>Twitch OAuth Authentication Server</h1>
          <p>This server is running for Twitch OAuth token generation.</p>
          <p><strong>To authenticate, visit:</strong></p>
          <p><a href="/auth" style="font-size: 18px; color: #9146FF; text-decoration: none; font-weight: bold;">http://localhost:${port}/auth</a></p>
          <p style="margin-top: 30px; color: #666;">
            After authentication, you can close this window and stop the server (Ctrl+C).
          </p>
        </body>
      </html>
    `);
  });

  // Route to start the OAuth flow
  app.get('/auth', (_req, res) => {
    const authUrl =
      `https://id.twitch.tv/oauth2/authorize?` +
      `client_id=${config.twitch.clientId}` +
      `&redirect_uri=${encodeURIComponent(config.twitch.redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(config.twitch.scopes)}`;
    res.redirect(authUrl);
  });

  // Route to handle the callback from Twitch
  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).send('No authorization code provided.');
    }

    try {
      // Twitch OAuth2 token endpoint - using form-encoded body (OAuth2 standard)
      // Note: axios 'params' puts data in query string, but OAuth2 spec requires form-encoded body
      // Consensus project uses 'params' which works, but form-encoded body is the correct standard
      const tokenResponse = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        new URLSearchParams({
          client_id: config.twitch.clientId,
          client_secret: config.twitch.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.twitch.redirectUri,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await saveTokens(tokenResponse.data);
      res.send('Authentication successful! You can close this window. Tokens have been saved.');
      return;
    } catch (error: any) {
      logger.error({ error }, 'Error fetching tokens');
      
      // Provide helpful error messages
      let errorMessage = 'Failed to fetch tokens. ';
      if (error.response?.status === 403) {
        errorMessage += 'This usually means:\n' +
          '1. The redirect URI in your Twitch app settings does not match: ' + config.twitch.redirectUri + '\n' +
          '2. The authorization code has expired (codes expire quickly)\n' +
          '3. The authorization code was already used\n' +
          '4. The Client Secret is incorrect\n\n' +
          'Please check your Twitch app settings and try the authorization flow again.';
      } else if (error.response?.status === 400) {
        errorMessage += 'Invalid request. Check that your Client ID, Client Secret, and authorization code are correct.';
      } else {
        errorMessage += 'Check the server logs for details.';
      }
      
      res.status(500).send(errorMessage);
      return;
    }
  });

  app.listen(port, () => {
    logger.info(`Twitch auth server running on http://localhost:${port}`);
    logger.info(`Visit http://localhost:${port}/auth to authenticate.`);
  });
}

// If this file is run directly, start the auth server
if (require.main === module) {
  startAuthServer();
}

