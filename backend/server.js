const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");


const app = express();
const PORT = process.env.PORT || 5001

const transfers = new Map();
const TRANSFER_TIME_MS = 10 * 60 * 1000; 


const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_SIZE = 100 * 1024 * 1024; 

const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
        cb(null, crypto.randomUUID());
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE }
});

function generateCode() {
    
    let code = null;

    while (code === null || transfers.has(code)) {
        code = "";

        for (let i = 0; i < 6; i++) {
            const temp = crypto.randomInt(chars.length);
            code += chars[temp];
        }
    }

    return code;
}

function findTransfer(code) {
    
    if (typeof code !== "string") {
        return null;
    }

    const normalized = code.toUpperCase();
    const validFormat = /^[A-Z0-9]{6}$/;

    if (validFormat.test(normalized) === false) {
        return null;
    }

    const record = transfers.get(normalized);

    if (record) {
        return record;
    } else {
        return null;
    }
}

app.get("/", (request, response) => {
    console.log("GET / received");
    response.send("FileDrop backend is working!");
});

app.post("/api/transfers", upload.single("file"), (request, response) => {
    
    if (!request.file) {
        return response.status(400).json({ error: "No file uploaded" });
    }

    const code = generateCode();

    const record = {
        storedName: request.file.filename,
        originalName: path.basename(request.file.originalname),
        size: request.file.size,
        mimeType: request.file.mimetype,
        expiresAt: Date.now() + TRANSFER_TIME_MS,
        status: "ready"
    };

    transfers.set(code, record);

    return response.status(201).json({
        code: code,
        filename: record.originalName,
        size: record.size,
        expiresAt: record.expiresAt
    });
});

app.get("/api/transfers/:code", (request, response) => {
    
    const record = findTransfer(request.params.code)

    if (!record){
        return response.status(404).json({error: "File not found" });
    }

    return response.json({ filename: record.originalName, size: record.size, expiresAt: record.expiresAt })
})

app.get("/api/transfers/:code/download", (request, response, next) => {
    const record = findTransfer(request.params.code);

    if (!record) {
        return response.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(UPLOAD_DIR, record.storedName);

    response.download(filePath, record.originalName, (err) => {
        if (err) {
            next(err);
        }
    });
});

app.use((err, req, res, next) => {
    
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            const maxMB = MAX_FILE_SIZE / (1024 * 1024);
            return res.status(413).json({
                error: `File too large. Maximum allowed size is ${maxMB} MB.`
            });
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                error: 'Unexpected field. The upload field must be named "file".'
            });
        }

        return res.status(400).json({ error: err.message });
    }

    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});