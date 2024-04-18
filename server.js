require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const path = require('path');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '/uploads/');
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
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
bot.start((ctx) => {
    ctx.reply('Welcome to the Secure App!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Open App', url: 'https://20.233.57.117' }]]
      }
    });
  });
bot.help((ctx) => ctx.reply('You can use this bot to share files securely. Send /upload to start uploading your files.'));

const channelUsername = '-1002059159519'; // 여기서 채널의 사용자 이름으로 대체하세요.
const messageText = "Here is a message with some cool options:";
const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.url('Visit Website', 'https://example.com'),
    Markup.button.callback('Click Me', 'click_me')
]);

app.post('/send', async (req, res) => {
    try {
        await bot.telegram.sendMessage(channelUsername, messageText, {
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard
        });
        res.status(200).send('Message sent successfully');
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).send('Failed to send message');
    }
});


// 추가 명령어
bot.command('status', (ctx) => {
    // 상태 확인 로직 (예시)
    ctx.reply('All systems operational.');
});

// Bot을 webhook 모드로 설정
bot.telegram.setWebhook('https://20.233.57.117/telegram/webhook');

app.post('/telegram/webhook', (req, res) => {
  bot.handleUpdate(req.body, res).catch((err) => console.log(err));
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    res.json({ message: 'File uploaded successfully!', filePath: req.file.path });
});
bot.action('click_me', (ctx) => {
  ctx.answerCbQuery('You clicked the button!');
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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