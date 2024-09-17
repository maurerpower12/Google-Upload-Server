const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Photos = require('googlephotos');
const { exec } = require('child_process');

const app = express();
const port = 3000;
// Load Google OAuth2 credentials
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = 'token.json';
const SCOPES = [Photos.Scopes.READ_ONLY, Photos.Scopes.READ_AND_APPEND];
const ALBUM_ID = 'AJpAlTpor0z34OUMyZcIDm0sEDgnBh76mzMTKGk_zoy9nuRRXJt9jdhWO1G_1Wn0cjRvWbzqmZjg';

let authClient;
let photos;

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
    const fileExt = ".png";

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

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf8');
        oAuth2Client.setCredentials(JSON.parse(token));
        photos = new Photos(JSON.parse(token).access_token);
    } else {
        // Get and store new token (manual step)
        const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
        console.log('Authorize this app by visiting this url:', authUrl);
        openBroswer(authUrl);
    }
    authClient = oAuth2Client;
}

app.post('/api/upload', upload.single('photo'), async (req, res) => {
  console.log("[UPLOAD API] called: ", req.body);
  console.log("Uploaded: ", req.file);
  
  try {
      const filePath = req.file.path;

      if (!authClient) await authorize();

      uploadToGooglePhotos(authClient, filePath, ALBUM_ID);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/getFolderName', async (req, res) => {
  console.log("[UPLOAD getFolderName API] called");
  
  try {
      if (!authClient) await authorize();

      const response = await photos.albums.get(ALBUM_ID);
      console.log('Album Name:', response);
      //listAlbums();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      if (error.response) {
        const errorResponse = await error.response.json();
        console.error('API error details:', errorResponse);
      }
      res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/listAllAlbums', async (req, res) => {
  console.log("[UPLOAD listAllAlbums API] called");
  
  try {
      if (!authClient) await authorize();
      await listAlbums();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      if (error.response) {
        const errorResponse = await error.response.json();
        console.error('API error details:', errorResponse);
      }
      res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/auth/google/callback', async (req, res) => {
  try {
      const code = req.query.code;

      if (!authClient) await authorize();

      // Get the access token from the authorization code
      const { tokens } = await authClient.getToken(code);
      authClient.setCredentials(tokens);

      photos = new Photos(tokens.access_token);

      // Store the token for later use
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

      res.send('Authentication successful! You can close this window.');
  } catch (error) {
      console.error('Error during authentication:', error);
      res.status(500).send('Authentication failed. Please try again.');
  }
});

async function uploadToGooglePhotos(authClient, filePath, albumId) {
  try {
    await photos.mediaItems.upload(albumId, "name", filePath, "description");
  } catch (err) {
    console.error('The API returned an error:', err.message);
    if (err.response) {
      const errorResponse = await err.response.json();
      console.error('API error details:', errorResponse);
    }
  } 
}

const openBroswer = (url) => {
  const startCmd = {
    darwin: 'open', //macOS
    win32: 'start', // windows
    linux: 'xdg-open' // linux
  }[process.platform]

  if (startCmd) {
    exec(`${startCmd} ${url}`, (error) => {
      if (error) {
        console.error('Failed to open broswer to: ', url, error);
      }
    });
  } else {
    console.error('Platform not supported');
  }
}

async function listAlbums() {
  try {
    const albumsResponse = await photos.albums.list(50);
    console.log('Albums:', albumsResponse);
  } catch (err) {
    console.error('The API returned an error:', err.message);
    if (err.response) {
      const errorResponse = await err.response.json();
      console.error('API error details:', errorResponse);
    }
  }
}
