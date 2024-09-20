const fs = require("fs");
const path = require("path");
const { Dropbox, DropboxAuth } = require("dropbox");
const fetch = require("node-fetch");

const TOKEN_PATH = "dropboxToken.json";
const CREDENTIALS_PATH = path.join(__dirname, "dropboxCredentials.json");

// Varaibles can be found in dropboxCredentials json file
let DROPBOX_APP_KEY;
let DROPBOX_APP_SECRET;
let REDIRECT_URI;

// Upload a file to Dropbox
async function uploadToDropbox(filePath) {
  try {
    const accessToken = await refreshTokenIfNeeded();
    const dropboxClient = new Dropbox({ accessToken: accessToken });
    const fileContent = fs.readFileSync(filePath); // Read file content
    const fileName = path.basename(filePath); // Extract file name

    // Upload the file to the root of Dropbox or to a specified folder
    const response = await dropboxClient.filesUpload({
      path: "/" + fileName, // Upload file to the root of Dropbox
      contents: fileContent,
    });

    console.log("File uploaded successfully:", response.result);
  } catch (err) {
    console.error("Failed to upload file:", err.message);
    throw err;
  }
}

// Authorization flow for Dropbox using OAuth2
async function authorizeDropbox(req, res) {
  try {
    await populateCredentials();
    const dropbox = new DropboxAuth({
      clientId: DROPBOX_APP_KEY,
      clientSecret: DROPBOX_APP_SECRET,
      fetch,
    });

    // Generate OAuth2 authorization URL
    const authUrl = await dropbox.getAuthenticationUrl(
      REDIRECT_URI,
      null,
      "code",
      "offline",
      null,
      "none",
      false,
    );

    // Open the browser for user to authenticate and approve access
    console.log("Authorize this app by visiting this url:", authUrl);
    const open = (await import("open")).default;
    await open(authUrl);
  } catch (error) {
    console.error("Error during authentication:", error);
  }
}

// Callback handler for the OAuth2 flow
async function dropboxCallback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      throw new Error("No authorization code found.");
    }

    // Use the code to exchange for an access token
    const dropbox = new DropboxAuth({
      clientId: DROPBOX_APP_KEY,
      clientSecret: DROPBOX_APP_SECRET,
      fetch,
    });

    const response = await dropbox.getAccessTokenFromCode(REDIRECT_URI, code);
    const { access_token: accessToken, refresh_token: refreshToken } =
      response.result;
    dropbox.setRefreshToken(refreshToken);

    // Save the access token for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(response.result));

    console.log("Access Token saved:", accessToken);

    res.send("Authentication successful! You can close this window.");
    console.log("Authentication successful");
  } catch (error) {
    console.error("Error during authentication Callback:", error);
    res.status(500).send("Authentication Callback failed. Please try again.");
  }
}

// Function to refresh the token if expired
async function refreshTokenIfNeeded() {
  try {
    // Load token data from file (this contains access_token, refresh_token, expires_in, etc.)
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    const { access_token, refresh_token, expires_in } = tokenData;

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime >= expires_in) {
      console.log("Access token expired. Refreshing token...");

      // Initialize DropboxAuth with client credentials
      const dropboxAuth = new DropboxAuth({
        clientId: DROPBOX_APP_KEY,
        clientSecret: DROPBOX_APP_SECRET,
        refreshToken: refresh_token,
        fetch,
      });

      // Request a new access token
      const response = await dropboxAuth.refreshAccessToken();
      const newAccessToken = response.result.access_token;
      const newExpiresIn = response.result.expires_in;

      // Calculate the new expiration time
      const newExpiresAt = Math.floor(Date.now() / 1000) + newExpiresIn;

      // Update the token data and save it back to the file
      const updatedTokenData = {
        ...tokenData,
        access_token: newAccessToken,
        expires_in: newExpiresAt,
      };
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokenData, null, 2));

      console.log(
        "Token refreshed successfully. New access token:",
        newAccessToken,
      );

      // Return the new access token to be used in subsequent API calls
      return newAccessToken;
    } else {
      console.log("Access token is still valid.");
      return access_token; // Return the current access token if it hasn't expired
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
}

// Populates the credentials from the disk storage
async function populateCredentials() {
  if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET || !REDIRECT_URI) {
    console.log("Populating credentials...");
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
    DROPBOX_APP_KEY = credentials.DROPBOX_APP_KEY;
    DROPBOX_APP_SECRET = credentials.DROPBOX_APP_SECRET;
    REDIRECT_URI = credentials.REDIRECT_URI;
  } else {
    console.log("Using existing credentials");
  }
}

module.exports = {
  uploadToDropbox,
  dropboxCallback,
  authorizeDropbox,
};
