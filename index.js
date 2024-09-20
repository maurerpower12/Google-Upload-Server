const express = require("express");
const multer = require("multer");
const {
  authorize,
  uploadToGooglePhotos,
  listAlbums,
  getAlbumName,
  callback,
} = require("./googlePhotosApi");
const {
  uploadToDropbox,
  authorizeDropbox,
  dropboxCallback,
} = require("./dropboxApi");

const app = express();
const port = 3000;

const backendOptions = {
  GooglePhotos: "GooglePhotos",
  Dropbox: "Dropbox",
};
const provider = backendOptions.Dropbox;

// Set up multer for file uploads
const uploadDir = "uploads/";
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
  },
});
const upload = multer({ storage: storage, preservePath: true });

app.listen(port, async () => {
  switch (provider) {
    case backendOptions.GooglePhotos: {
      await authorize();
    }
    case backendOptions.Dropbox: {
      await authorizeDropbox();
    }
  }
  console.log(`Server listening on port http://localhost:${port}`);
});

app.get("/api/healthcheck", (req, res) => {
  res.sendStatus(200);
});

app.post("/api/upload", upload.single("photo"), async (req, res) => {
  console.log("[UPLOAD API] called: ", req.body);
  console.log("Uploaded: ", req.file);

  try {
    const filePath = req.file.path;
    switch (provider) {
      case backendOptions.GooglePhotos: {
        await uploadToGooglePhotos(filePath);
        res.status(200).json({ success: true });
      }
      case backendOptions.Dropbox: {
        await uploadToDropbox(filePath);
        res.status(200).json({ success: true });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/getFolderName", async (req, res) => {
  console.log("[UPLOAD getFolderName API] called");

  try {
    const albumName = await getAlbumName();
    res.status(200).json({ success: true, albumName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/listAllAlbums", async (req, res) => {
  console.log("[UPLOAD listAllAlbums API] called");

  try {
    await listAlbums();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/auth/google/callback", async (req, res) => {
  callback(req, res);
});

app.get("/auth/dropbox/callback", async (req, res) => {
  dropboxCallback(req, res);
});
