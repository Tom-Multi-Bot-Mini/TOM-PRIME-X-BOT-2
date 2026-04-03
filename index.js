const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.get("/", (req, res) => res.send("TOM-PRIME-X IS ACTIVE"));
app.listen(process.env.PORT || 10000);

async function startBot() {
    // সেশন ফোল্ডার সেটআপ
    const authFolder = './auth_info';
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder);
    
    // মেইন ডিরেক্টরি থেকে creds.json কপি করা
    if (fs.existsSync('./creds.json')) {
        fs.copyFileSync('./creds.json', path.join(authFolder, 'creds.json'));
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Tom-Prime-X", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Reconnecting...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log("🚀 SUCCESS! TOM-PRIME-X IS CONNECTED!");
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (body.toLowerCase() === "+menu") {
            const menu = `┏━━━━━━━━━━━━━━┓\n┃ ✨ *TOM-PRIME-X* ✨ ┃\n┗━━━━━━━━━━━━━━┛\n\n👤 *Owner:* Tom\n✅ *Status:* Online\n\nবট সফলভাবে চালু হয়েছে!`;
            await sock.sendMessage(from, { text: menu }, { quoted: msg });
        }
    });
}

startBot();
