const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const app = express();

app.get("/", (req, res) => res.send("TOM-PRIME-X IS ACTIVE"));
app.listen(process.env.PORT || 10000);

async function startBot() {
    // সেশন আইডি থেকে ক্রেড ফাইল তৈরি করা
    if (!fs.existsSync('./session_auth/creds.json')) {
        const session_id = process.env.SESSION_ID;
        if (session_id) {
            const auth_json = Buffer.from(session_id.split('Gifted~')[1], 'base64').toString();
            if (!fs.existsSync('./session_auth')) fs.mkdirSync('./session_auth');
            fs.writeFileSync('./session_auth/creds.json', auth_json);
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    
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
            console.log("✅ SUCCESS! TOM-PRIME-X IS CONNECTED!");
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (body.toLowerCase() === "+menu") {
            await sock.sendMessage(from, { text: "✨ *TOM-PRIME-X* ✨\n\nবট সফলভাবে কানেক্ট হয়েছে!" });
        }
    });
}

startBot();
