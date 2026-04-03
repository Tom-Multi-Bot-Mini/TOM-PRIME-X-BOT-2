const { default: makeWASocket, useMultiFileAuthState, disconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

// সার্ভার চালু রাখা
app.get("/", (req, res) => res.send("TOM-PRIME-X IS RUNNING"));
app.listen(port);

async function startBot() {
    // এখানে সেশন আইডি চেক করার সিস্টেম
    const session_id = process.env.SESSION_ID;
    if (!session_id) {
        console.log("Error: SESSION_ID NOT FOUND IN RENDER SETTINGS!");
        return;
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    
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
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== disconnectReason.loggedOut;
            console.log("Connection closed. Reconnecting...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log("SUCCESS! TOM-PRIME-X IS CONNECTED!");
            sock.sendMessage(sock.user.id, { text: "TOM-PRIME-X SUCCESSFULLY CONNECTED! ✅" });
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (body === "+menu") {
            await sock.sendMessage(from, { text: "✨ *TOM-PRIME-X* ✨\n\nStatus: Online\nOwner: Tom\n\nবটটি এখন কাজ করছে!" });
        }
    });
}

startBot();
