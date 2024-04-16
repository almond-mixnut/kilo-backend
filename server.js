require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(express.json());

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

// Endpoint to handle file uploads
app.post('/upload', async (req, res) => {
    const buffer = Buffer.from(req.body.file, 'base64'); // Assuming file is uploaded as base64 string
    const blobName = uuidv4();
    const containerClient = blobServiceClient.getContainerClient('files');
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
        await blockBlobClient.upload(buffer, buffer.length);
        const downloadLink = `https://20.233.57.117/download/${blobName}`;
        res.status(200).json({ message: 'File uploaded successfully!', downloadLink });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload file', error: error.message });
    }
});

// Telegram bot message handler
bot.start((ctx) => ctx.reply('Welcome to the File Sharing Bot!'));
bot.help((ctx) => ctx.reply('Upload files in the miniapp and share them here!'));

bot.launch();

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
