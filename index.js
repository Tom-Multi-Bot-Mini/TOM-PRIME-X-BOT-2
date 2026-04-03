const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

global.botname = "TOM-PRIME-X";
global.ownername = "tom";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" })
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (text === "+menu") {
            await sock.sendMessage(msg.key.remoteJid, { text: `✨ ${global.botname} ✨\nOwner: ${global.ownername}\nStatus: Active` });
        }
    });
}
startBot();
