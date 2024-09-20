const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const Photos = require("googlephotos");

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = "token.json";
const SCOPES = [Photos.Scopes.READ_ONLY, Photos.Scopes.READ_AND_APPEND];
const ALBUM_ID = "ID";
let photos;
let authClient;

async function authorize(code = null) {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH, "utf8");
    oAuth2Client.setCredentials(JSON.parse(token));
    photos = new Photos(JSON.parse(token).access_token);
  } else if (code) {
    // Get the access token from the authorization code
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    photos = new Photos(tokens.access_token);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  } else {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const open = (await import("open")).default;
    await open(authUrl);
  }

  authClient = oAuth2Client;
}

async function callback(req, res) {
  try {
    const code = req.query.code;

    if (!authClient) await authorize();

    // Get the access token from the authorization code
    const { tokens } = await authClient.getToken(code);
    authClient.setCredentials(tokens);

    photos = new Photos(tokens.access_token);

    // Store the token for later use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    res.send("Authentication successful! You can close this window.");
    console.log("Authentication successful");
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).send("Authentication failed. Please try again.");
  }
}

async function uploadToGooglePhotos(filePath) {
  try {
    await photos.mediaItems.upload(ALBUM_ID, "name", filePath, "description");
  } catch (err) {
    console.error("The API returned an error:", err.message);
    if (err.response) {
      const errorResponse = await err.response.json();
      console.error("API error details:", errorResponse);
    }
  }
}

async function listAlbums() {
  try {
    const albumsResponse = await photos.albums.list(50);
    console.log("Albums:", albumsResponse);
  } catch (err) {
    console.error("The API returned an error:", err.message);
    if (err.response) {
      const errorResponse = await err.response.json();
      console.error("API error details:", errorResponse);
    }
  }
}

async function getAlbumName() {
  try {
    const response = await photos.albums.get(ALBUM_ID);
    return response.title;
  } catch (err) {
    console.error("Error fetching album name:", err.message);
    throw err;
  }
}

module.exports = {
  authorize,
  callback,
  uploadToGooglePhotos,
  listAlbums,
  getAlbumName,
};
