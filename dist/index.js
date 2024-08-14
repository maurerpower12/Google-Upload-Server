"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const googleapis_1 = require("googleapis");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Multer storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
// Google Drive API configuration
const auth = new googleapis_1.google.auth.GoogleAuth({
// ... your authentication configuration
});
// Replace with your desired upload folder ID
const UPLOAD_FOLDER_ID = 'your_upload_folder_id';
app.use((0, cors_1.default)());
app.get('/healthcheck', (req, res) => {
    res.sendStatus(200);
});
app.post('/upload', upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const fileName = ((_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname) || '';
    console.log(`Attempting to upload file ${fileName} to Google Drive`);
    // try {
    //   const authClient = await auth.getClient();
    //   const drive = google.drive({ version: 'v3', auth: authClient });
    //   const fileMetadata: drive_v3.Schema$File = {
    //     name: fileName,
    //     parents: [UPLOAD_FOLDER_ID],
    //   };
    //   // const media: drive_v3.S = {
    //   //   body: req.file?.buffer,
    //   // };
    //   const media = {
    //     mimeType: 'image/jpeg',
    //     body: req.file?.buffer,
    //   };
    //   const response = await drive.files.create({
    //     resource: fileMetadata,
    //     media: media,
    //     fields: 'id',
    //   });
    //   res.json({ fileId: response.data.id });
    // } catch (error) {
    //   console.error('Error uploading image:', error);
    //   res.status(500).json({ error: 'Failed to upload image' });
    // }
}));
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
