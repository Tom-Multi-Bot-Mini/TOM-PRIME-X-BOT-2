const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static('public'));

//--- UI সেকশন (HTML) ---
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TOM-PRIME-X SESSION</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background: #000; color: #0f0; font-family: monospace; text-align: center; padding: 20px; }
                .box { border: 2px solid #0f0; padding: 20px; border-radius: 10px; display: inline-block; }
                input { padding: 10px; border-radius: 5px; border: 1px solid #0f0; background: #222; color: #fff; margin: 10px 0; width: 80%; }
                button { padding: 10px 20px; background: #0f0; color: #000; border: none; cursor: pointer; font-weight: bold; }
                .qr-box { background: #fff; padding: 10px; display: none; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>✨ TOM-PRIME-X SESSION ✨</h1>
                <p>Enter number with country code (e.g. 88017...)</p>
                <input type="text" id="number" placeholder="880XXXXXXXXXX">
                <br>
                <button onclick="getPairing()">GET PAIRING CODE</button>
                <h2 id="pair-display" style="color: #fff;"></h2>
                <hr>
                <p>OR Scan QR Code (Coming soon in logs)</p>
            </div>
            <script>
                async function getPairing() {
                    const num = document.getElementById('number').value;
                    if(!num) return alert("Number den bhai!");
                    document.getElementById('pair-display').innerText = "Generating...";
                    const res = await fetch('/pair?num=' + num);
                    const data = await res.json();
                    document.getElementById('pair-display').innerText = "YOUR CODE: " + data.code;
                }
            </script>
        </body>
        </html>
    `);
});

//--- বট লজিক সেকশন ---
async function startBot(num = null, res = null) {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: ["Tom-Prime-X", "Chrome", "1.0.0"]
    });

    if (num && !sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(num);
            if (res) res.json({ code: code });
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ CONNECTED!");
            await sock.sendMessage(sock.user.id, { text: "🚀 *TOM-PRIME-X Bot Connected Successfully!* \n\nEkhon apni bot ta upovog koren bhai!" });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });
}

// API Route for Pairing
app.get("/pair", async (req, res) => {
    const num = req.query.num;
    await startBot(num, res);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startBot(); // ডিফল্টভাবে কিউআর কোড লগে প্রিন্ট হবে
});
