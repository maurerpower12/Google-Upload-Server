const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});

app.get('/api/healthcheck', (req, res) => {
  res.sendStatus(200);
});

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Load Google OAuth2 credentials
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/photoslibrary'];
const ALBUM_ID = 'AF1QipPeUoVGbAPDVJlVif6DMYfRWArLc7FL7z6i02OK';

let authClient;

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf8');
        oAuth2Client.setCredentials(JSON.parse(token));
    } else {
        // Get and store new token (manual step)
        const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
        console.log('Authorize this app by visiting this url:', authUrl);
        // Add code here to handle the authorization manually and store the token
    }
    authClient = oAuth2Client;
}

app.post('/api/upload', upload.single('photo'), async (req, res) => {
  console.log("[UPLOAD API] called")
    try {
        const filePath = req.file.path;

        if (!authClient) await authorize();

        const mediaItemId = await uploadPhoto(authClient, filePath, ALBUM_ID);

        res.status(200).json({ success: true, mediaItemId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete temporary file:', err);
        });
    }
});

app.get('/auth/google/callback', async (req, res) => {
  try {
      const code = req.query.code;

      if (!authClient) await authorize();

      // Get the access token from the authorization code
      const { tokens } = await authClient.getToken(code);
      authClient.setCredentials(tokens);

      // Store the token for later use
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

      res.send('Authentication successful! You can close this window.');
  } catch (error) {
      console.error('Error during authentication:', error);
      res.status(500).send('Authentication failed. Please try again.');
  }
});

async function uploadPhoto(authClient, filePath, albumId) {
    const fileName = path.basename(filePath);

    // Step 1: Upload the image to Google Photos to get an upload token
    const uploadToken = await getUploadToken(authClient, filePath);

    // Step 2: Use the upload token to create a media item
    const mediaItemId = await createMediaItem(authClient, uploadToken, albumId);

    return mediaItemId;
}

async function getUploadToken(authClient, filePath) {
    const fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    const response = await axios.post('https://photoslibrary.googleapis.com/v1/uploads', fileStream, {
        headers: {
            'Authorization': `Bearer ${authClient.credentials.access_token}`,
            'Content-Type': 'application/octet-stream',
            'X-Goog-Upload-File-Name': path.basename(filePath),
            'X-Goog-Upload-Protocol': 'raw',
            'Content-Length': fileSize
        }
    });

    return response.data;  // This is the upload token
}

async function createMediaItem(authClient, uploadToken, albumId) {
    const response = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
        albumId: albumId,
        newMediaItems: [
            {
                simpleMediaItem: {
                    uploadToken: uploadToken
                }
            }
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${authClient.credentials.access_token}`,
            'Content-Type': 'application/json'
        }
    });

    const mediaItemResult = response.data.newMediaItemResults[0];
    if (mediaItemResult.status && mediaItemResult.status.code === 0) {
        return mediaItemResult.mediaItem.id;
    } else {
        throw new Error('Error creating media item: ' + mediaItemResult.status.message);
    }
}
