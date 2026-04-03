const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const app = express();

app.get("/", (req, res) => res.send("TOM-PRIME-X IS RUNNING"));
app.listen(process.env.PORT || 10000);

async function startBot() {
    const authPath = './auth_info';
    if (!fs.existsSync(authPath)) fs.mkdirSync(authPath);

    // যদি creds.json ফাইলে সেশন থাকে তা কপি করা
    if (fs.existsSync('./creds.json')) {
        fs.copySync('./creds.json', path.join(authPath, 'creds.json'));
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Tom-Prime-X", "Safari", "3.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log("Connection closed. Reason Code:", reason);
            // যদি সেশন নষ্ট হয়ে যায় (401), তবে ফাইল মুছে আবার ট্রাই করবে
            if (reason === DisconnectReason.loggedOut) {
                fs.removeSync(authPath);
                console.log("Logged out. Please get a NEW Session ID!");
            } else {
                startBot();
            }
        } else if (connection === 'open') {
            console.log("🚀 SUCCESS! TOM-PRIME-X IS CONNECTED!");
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (body.toLowerCase() === "+menu") {
            await sock.sendMessage(msg.key.remoteJid, { text: "✨ *TOM-PRIME-X* ✨\n\nবট এখন অনলাইন!" });
        }
    });
}

startBot().catch(err => console.log("Startup Error:", err));
