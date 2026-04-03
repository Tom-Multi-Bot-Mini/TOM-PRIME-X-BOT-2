const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const app = express();

app.get("/", (req, res) => res.send("TOM-PRIME-X IS ACTIVE"));
app.listen(process.env.PORT || 10000);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: ["Tom-Prime-X", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) console.log("SCAN THIS QR CODE IN WHATSAPP:");
        if (connection === 'open') console.log("✅ SUCCESS! CONNECTED!");
        if (connection === 'close') startBot();
    });
}
startBot();
