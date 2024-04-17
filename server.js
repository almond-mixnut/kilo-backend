require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const path = require('path');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

// HTTPS 서버 옵션
const options = {
  pfx: fs.readFileSync(path.join(__dirname, 'test.pfx')),
};

// 모든 HTTP 요청을 index.html로 리다이렉트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Bot 기본 명령어 설정
bot.start((ctx) => ctx.reply('Welcome to the Secure App! This is the start message.'));
bot.help((ctx) => ctx.reply('You can use this bot to share files securely. Send /upload to start uploading your files.'));

// 추가 명령어
bot.command('upload', (ctx) => ctx.reply('Please use the app to upload files. Here is the link: https://20.233.57.117'));
bot.command('status', (ctx) => {
    // 상태 확인 로직 (예시)
    ctx.reply('All systems operational.');
});

// Bot을 webhook 모드로 설정
bot.telegram.setWebhook('https://20.233.57.117/telegram/webhook');

app.post('/telegram/webhook', (req, res) => {
  bot.handleUpdate(req.body, res).catch((err) => console.log(err));
});

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


// HTTPS 서버 실행
https.createServer(options, app).listen(443, () => {
  console.log('HTTPS server running on port 443');
});

bot.launch();