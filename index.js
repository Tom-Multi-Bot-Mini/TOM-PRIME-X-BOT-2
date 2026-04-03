const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("TOM-PRIME-X IS RUNNING"));
app.listen(process.env.PORT || 10000);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Tom-Prime-X", "Chrome", "1.0.0"]
    });

    // এখানে আপনার নিজের হোয়াটসঅ্যাপ নম্বর দিন (Country Code সহ, যেমন: 88017...)
    let phoneNumber = "8801XXXXXXXXX"; 

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n\n👉 YOUR PAIRING CODE: ${code}\n\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') console.log("✅ SUCCESS! CONNECTED!");
    });
}
startBot();
