const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const photos = require('googlephotos');

const app = express();
const port = 3000;

app.listen(port, async () => {
  await authorize();
  console.log(`Server listening on port http://localhost:${port}`);
});

app.get('/api/healthcheck', (req, res) => {
  res.sendStatus(200);
});

// Set up multer for file uploads
const uploadDir = 'uploads/';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    console.log("File: ", file);
    var fileName = "defaultFileName";
    const fileExt = ".jpg";

    if (file.originalname) {
      fileName = file.originalname;
    } else {
      const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
      fileName = file.fieldname + "_" + uniqueSuffix + fileExt;
    }

    console.log("Saving to fileName: " + fileName);
    cb(null, fileName);
  }
})
const upload = multer({ storage: storage, preservePath: true });

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
    }
    authClient = oAuth2Client;
}

app.post('/api/upload', upload.single('photo'), async (req, res) => {
  console.log("[UPLOAD API] called: ", req.body);
  console.log("Uploaded: ", req.file);
  res.status(200).json({ success: true });
    // try {
    //     const filePath = req.file.path;

    //     if (!authClient) await authorize();

    //     const mediaItemId = await uploadPhoto(authClient, filePath, ALBUM_ID);

    //     res.status(200).json({ success: true, mediaItemId });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ success: false, error: error.message });
    // } finally {
    //     fs.unlink(req.file.path, (err) => {
    //         if (err) console.error('Failed to delete temporary file:', err);
    //     });
    // }
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
    const mediaItemId = await createMediaItem(authClient, uploadToken, albumId, fileName);

    return mediaItemId;
}

async function getUploadToken(authClient, filePath) {
    const fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;
    const mimeType = 'image/jpeg';

    try {
      const response = await axios.post('https://photoslibrary.googleapis.com/v1/uploads', fileStream, {
          headers: {
              'Authorization': `Bearer ${authClient.credentials.access_token}`,
              'Content-Type': 'application/octet-stream',
              'X-Goog-Upload-Content-Type': mimeType,
              //'X-Goog-Upload-File-Name': path.basename(filePath),
              'X-Goog-Upload-Protocol': 'raw',
              'Content-Length': fileSize
          }
      });

      const uploadToken = response.data;
      console.log("Upload Token: " + uploadToken);
      return uploadToken;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

async function createMediaItem(authClient, uploadToken, albumId, fileName) {
  try {
    const response = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
        albumId: albumId,
        newMediaItems: [
            {
              description: 'Photo booth picture',
              simpleMediaItem: {
                  fileName: 'photo1.jpg', //fileName,
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
      console.log("Upload Media : " + JSON.stringify(mediaItemResult));
        return mediaItemResult.mediaItem.id;
    } else {
        throw new Error('Error creating media item: ' + mediaItemResult.status.message);
    }
  } catch (error) {
    console.error('Error uploading photo media:', error);
    throw error;
  }
}
