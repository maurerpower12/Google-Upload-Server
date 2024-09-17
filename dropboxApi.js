const fs = require('fs');
const path = require('path');
const { Dropbox } = require('dropbox'); // Import Dropbox SDK

const TOKEN_PATH = 'dropboxToken.json';

let dropboxClient;

// Initialize Dropbox client with access token (if available)
async function initializeDropboxClient(token = null) {
    if (token) {
        dropboxClient = new Dropbox({ accessToken: token });
    } else if (fs.existsSync(TOKEN_PATH)) {
        const savedToken = fs.readFileSync(TOKEN_PATH, 'utf8');
        const extractToken = JSON.parse(savedToken).access_token;
        dropboxClient = new Dropbox({ accessToken: extractToken});
    } else {
        throw new Error('Authorization required. No token found.');
    }
}

// Upload a file to Dropbox
async function uploadToDropbox(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath); // Read file content
        const fileName = path.basename(filePath); // Extract file name

        // Upload the file to the root of Dropbox or to a specified folder
        const response = await dropboxClient.filesUpload({
            path: '/' + fileName, // Upload file to the root of Dropbox
            contents: fileContent
        });

        console.log('File uploaded successfully:', response.result);
    } catch (err) {
        console.error('Failed to upload file:', err.message);
        throw err;
    }
}

module.exports = {
    initializeDropboxClient,
    uploadToDropbox
};