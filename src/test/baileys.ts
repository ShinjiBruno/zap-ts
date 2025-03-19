import makeWASocket, { Browsers, DisconnectReason, useMultiFileAuthState, makeInMemoryStore } from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import express from 'express';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '../');

const app = express();
const port = 3015;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let chatHistory: any[] = [];

const handleConnectionUpdate = (update:any) => {
    const { connection, lastDisconnect } = update
    if(connection === 'close') {
        const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
        // reconnect if not logged out
        if(shouldReconnect) {
            //initWASocket()
        }
    } else if(connection === 'open') {
        console.log('opened connection')
    }
}
export const initWASocket = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys');
    const _waSocket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: Browsers.windows('Desktop')
    });

    _waSocket.ev.on('connection.update', handleConnectionUpdate);
    _waSocket.ev.on('creds.update', saveCreds);
    _waSocket.ev.on('messaging-history.set', (chats: any) => {
        console.log('Chats set', chats);
        chatHistory = chats;
    });

    return _waSocket;
};

let waSocket: any;

export const waSocketAPIs = () => {
    app.post('/connect-session', async (req, res) => {
        waSocket = await initWASocket();
        res.json({ message: 'Session connected' });
    });

    app.post('/connect-and-post', async (req, res) => {
        await initWASocket();

        // Example of sending a message after connecting
        const { phoneNumber, message } = req.body;
        await waSocket.sendMessage(`${phoneNumber}@s.whatsapp.net`, { text: message });

        res.json({ message: 'Message sent' });
    });
    app.post('/make-in-memory-store', async (req, res) => {
        const store = makeInMemoryStore({ })
        // can be read from a file
        store.readFromFile('./baileys_store.json')
        // saves the state to a file every 10s
        setInterval(() => {
            store.writeToFile('./baileys_store.json')
        }, 10_000)
        // will listen from this socket
        // the store can listen from a new socket once the current socket outlives its lifetime
        store.bind(waSocket.ev)

        waSocket.ev.on('chats.upsert', () => {
            // can use 'store.chats' however you want, even after the socket dies out
            // 'chats' => a KeyedDB instance
            console.log('got chats', store.chats.all())
        })

        waSocket.ev.on('contacts.upsert', () => {
            console.log('got contacts', Object.values(store.contacts))
        })
    })

    app.get('/list-chats', async (req, res) => {
        try {
            res.json(chatHistory);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to list chats' });
        }
    });

    app.get('/list-messages', async (req, res) => {
        const { phoneNumber } = req.body;
        try {
            const messages = await waSocket?.loadMessages(`${phoneNumber}@s.whatsapp.net`, 25);
            res.json(messages);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to list messages' });
        }
    });

    app.get('/get-session-token', async (req, res) => {
        try {
            const authInfo = waSocket?.authState.creds;
            res.json(authInfo);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to get session token' });
        }
    });

    app.get('/get-file', async (req, res) => {
        const { messageId } = req.body;
        try {
            const message = await waSocket?.loadMessage(messageId);
            if (message?.message?.documentMessage) {
                const buffer = await waSocket.downloadMediaMessage(message);
                fs.writeFileSync(`./${message.message.documentMessage.fileName}`, buffer);
                res.json({ message: 'File downloaded' });
            } else {
                res.status(400).json({ error: 'Message does not contain a document' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to get file' });
        }
    });
};

waSocketAPIs();

app.listen(port, () => {
    console.log('Server running on port ' + port);
});