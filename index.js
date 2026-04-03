const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, // এখানে আগে ছোট হাতের d ছিল, ওটা ঠিক করে দিলাম
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();

const port = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("TOM-PRIME-X IS ACTIVE"));
app.listen(port);

async function startBot() {
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
            console.log("Connection closed. Reconnecting...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log("✅ TOM-PRIME-X IS CONNECTED!");
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (body.toLowerCase() === "+menu") {
            const menu = `┏━━━━━━━━━━━━━━┓\n┃ ✨ *TOM-PRIME-X* ✨ ┃\n┗━━━━━━━━━━━━━━┛\n\n👤 *Owner:* Tom\n✅ *Status:* Online\n\nবটটি সফলভাবে কাজ করছে!`;
            await sock.sendMessage(from, { text: menu }, { quoted: msg });
        }
    });
}

startBot();
