// import express, { Express, Request, Response } from 'express';
// import multer from 'multer';
// import cors from 'cors';
//import { google, drive_v3 } from 'googleapis';

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Multer storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// Google Drive API configuration
// const auth = new google.auth.GoogleAuth({
//   // ... your authentication configuration
// });

// Replace with your desired upload folder ID
//const UPLOAD_FOLDER_ID = 'your_upload_folder_id';

//app.use(cors());

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

app.get('/api/healthcheck', (req, res) => {
  res.sendStatus(200).json({ status: 'ok' });
});

















// app.post('/upload', upload.single('image'), async (req, res) => {
//   const fileName = req.file?.originalname || '';
//   console.log(`Attempting to upload file ${fileName} to Google Drive`);
//   // try {
//   //   const authClient = await auth.getClient();
//   //   const drive = google.drive({ version: 'v3', auth: authClient });

//   //   const fileMetadata: drive_v3.Schema$File = {
//   //     name: fileName,
//   //     parents: [UPLOAD_FOLDER_ID],
//   //   };

//   //   // const media: drive_v3.S = {
//   //   //   body: req.file?.buffer,
//   //   // };
//   //   const media = {
//   //     mimeType: 'image/jpeg',
//   //     body: req.file?.buffer,
//   //   };

//   //   const response = await drive.files.create({
//   //     resource: fileMetadata,
//   //     media: media,
//   //     fields: 'id',
//   //   });

//   //   res.json({ fileId: response.data.id });
//   // } catch (error) {
//   //   console.error('Error uploading image:', error);
//   //   res.status(500).json({ error: 'Failed to upload image' });
//   // }
// });

