const { default: makeWASocket, useMultiFileAuthState, delay, jidDecode } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

// --- রেন্ডারকে জ্যান্ত রাখার জন্য সার্ভার ---
app.get("/", (req, res) => res.send("TOM-PRIME-X IS ALIVE!"));
app.listen(port, () => console.log(`Server running on port ${port}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // যেহেতু আমরা সেশন আইডি দিচ্ছি
        logger: pino({ level: "silent" }),
        browser: ["Tom-Prime-X", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log("Connection closed, restarting...");
            startBot();
        } else if (connection === 'open') {
            console.log("TOM-PRIME-X Connected Successfully!");
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const prefix = "+";

        if (body === prefix + "menu") {
            const menuText = `┏━━━━━━━━━━━━━━┓\n┃ ✨ TOM-PRIME-X ✨ ┃\n┗━━━━━━━━━━━━━━┛\n\n👤 Owner: Tom\n⚙️ Prefix: [ ${prefix} ]\n✅ Status: Active\n\nPowered by Tom Prime x`;
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
        }
    });
}

startBot();
