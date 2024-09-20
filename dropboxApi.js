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
let TOKEN_DATA;

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
    return getShareableLinkToFile(dropboxClient, "/" + fileName);
  } catch (err) {
    console.error("Failed to upload file:", err.message);
    return "";
  }
}

async function getShareableLinkToFile(dropbox, dropboxPath) {
  try {
    const response = await dropbox.sharingCreateSharedLinkWithSettings({
      path: dropboxPath
    });

    console.log("Link to file:", response.result.url);
    return response.result.url;
  } catch (err) {
    console.error("Failed to get file link:", err);
    return ""; // TODO: Maybe return a generic link here?
  }
}

// Initialize Dropbox client with access token (if available)
async function initializeDropboxClient() {
  if (fs.existsSync(TOKEN_PATH)) {
    const savedToken = fs.readFileSync(TOKEN_PATH, "utf8");
    const obj = JSON.parse(savedToken);
    if (checkTokenValidity(obj.response.access_token) === true) {
      TOKEN_DATA = obj;
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// Authorization flow for Dropbox using OAuth2
async function authorizeDropbox(req, res) {
  try {
    await populateCredentials();
    const cachedToken = initializeDropboxClient();
    if (cachedToken === true) {
      return;
    }

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

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const newExpiresAt = currentTimeInSeconds + response.result.expires_in;
    TOKEN_DATA = { response: response.result, expires_at: newExpiresAt };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(TOKEN_DATA));

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
    const { response, expires_at } = TOKEN_DATA;

    if (!checkTokenValidity(response.access_token)) {
      console.log("Access token expired. Refreshing token...");

      // Initialize DropboxAuth with client credentials
      const dropboxAuth = new DropboxAuth({
        clientId: DROPBOX_APP_KEY,
        clientSecret: DROPBOX_APP_SECRET,
        refreshToken: response.refresh_token,
        fetch,
      });

      // Request a new access token
      const refreshResponse = await dropboxAuth.refreshAccessToken();
      const newAccessToken = refreshResponse.result.access_token;
      const newExpiresIn = refreshResponse.result.expires_in;

      // Calculate the new expiration time
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      const newExpiresAt = currentTimeInSeconds + newExpiresIn;

      // Update the token data and save it back to the file
      TOKEN_DATA = {
        response: refreshResponse.result,
        expires_at: newExpiresAt,
      };
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(TOKEN_DATA));

      console.log(
        "Token refreshed successfully. New access token:",
        newAccessToken,
      );

      // Return the new access token to be used in subsequent API calls
      return newAccessToken;
    } else {
      console.log("Access token is still valid.");
      return response.access_token; // Return the current access token if it hasn't expired
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
}

// Function to check if the access token is still valid by making a simple API call
async function checkTokenValidity(accessToken) {
  const dropbox = new Dropbox({
    accessToken: accessToken,
    fetch: fetch,
  });

  try {
    // Make an API call to get the current account information
    const response = await dropbox.usersGetCurrentAccount();
    return true;
  } catch (error) {
    if (error.status === 401) {
      console.log("Access token is invalid or expired.");
    } else {
      console.log("An error occurred:", error);
    }
    return false;
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
