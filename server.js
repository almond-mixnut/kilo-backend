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
let userIds = {};  // key: username, value: chatId

bot.start((ctx) => {
  ctx.reply('Welcome! I am your file sharing bot.');
  const username = ctx.from.username;
  const chatId = ctx.chat.id;
  // 사용자의 username과 chatId 매핑하여 저장
  userIds[username] = chatId;
  console.log(`Registered ${username} with ID ${chatId}`);
});

// 특정 사용자에게 메시지 보내기 예시 함수
function sendMessageToUser(username, message) {
  const chatId = userIds[username];
  if (chatId) {
    bot.telegram.sendMessage(chatId, message);
    console.log(`Message sent to ${username}: ${message}`);
  } else {
    console.log("User not found.");
  }
}

// 이벤트나 특정 조건 발생 시 메시지 보내기 (예: 파일 업로드 완료)
function notifyUserFileReady(username) {
  const message = "Your file is ready to download.";
  sendMessageToUser(username, message);
}

app.post('/send-message', (req, res) => {
    const { username, message } = req.body;
    if (username in userIds) {
      bot.telegram.sendMessage(userIds[username], message)
        .then(response => {
          console.log(`Message sent to ${username}`);
          res.status(200).send({ success: true, message: "Message sent successfully." });
        })
        .catch(error => {
          console.error("Failed to send message:", error);
          res.status(500).send({ success: false, message: "Failed to send message." });
        });
    } else {
      res.status(404).send({ success: false, message: "User not found." });
    }
  });

  
bot.launch();

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
