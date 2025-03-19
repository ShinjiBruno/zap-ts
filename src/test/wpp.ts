import { Ack, create, Message, SocketState, Whatsapp, Wid } from '@wppconnect-team/wppconnect';
const wppconnect = require('@wppconnect-team/wppconnect');
import express from 'express';
import fs from 'fs';
import path from 'path';
import { wppClients } from './wppclients';
import { SessionToken } from '@wppconnect-team/wppconnect/dist/token-store';

const rootDir = path.resolve(__dirname, '../') 

const app = express();
const port = 3010;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export function initWpp(){
    return wppconnect
    .create({
        session: 'sessionName',
        useChrome: false,
    });
}

/*---------------------------aux functions----------------------------*/
const iterateAllMessages = async () =>{
    try {
        console.log('⭐⭐ ITERATE ALL MESSAGES ⭐⭐');
        const startTime = Date.now(); 
        
        const chats = await client?.listChats();
        let sum = 0;
        
        const promises = chats.map(async (chat) => {
            const messages = await client?.getMessages(chat.id._serialized, { count: -1 });
    
            console.log(`chatId: ${chat.id._serialized}, messages count........ ${messages?.length}`);
            sum += messages?.length || 0;
            console.log('sum..........', sum);
        });
        
        await Promise.all(promises);
    
        const endTime = Date.now();
        const elapsedTime = endTime - startTime; 
        console.log(`Tempo total decorrido: ${elapsedTime}ms`);
    } catch (error) {
    }
}


/*--------------------------variables------------------------------*/
export let client: Whatsapp;
let onAnyMessageSet = false;
let onAckSet = false;
let onStateChangeSet = false;
let onReactionSet = false;
let socketState: SocketState;

/*--------------------------APIs-----------------------------*/

export async function wppAPIs (){
    app.post('/connect-session', async(req, res) => {
        const {phoneNumber} = req.body;
        try{
            create({
                session: phoneNumber,
                useChrome: false,
                waitForLogin: true,
            }).then(async (newClient)=>{
                client = newClient as Whatsapp;
            })

            onAckSet = false;
            onStateChangeSet = false;
            onReactionSet = false;
            
            res.json(client.session);            
        }catch{
            res.json('error');
        }
    });
    app.post('/connect-and-post', async(req, res) => {
        const {phoneNumber} = req.body;
        try{
            client = await create({
                session: phoneNumber,
                useChrome: false,
                waitForLogin: true,
                headless: true,
            })
            await iterateAllMessages()
            res.json(client.session);            
        }catch{
            res.json('error');
        }
    })
    app.get('/test-all-sessions', async(req, res) => {
        // for (const _session of testeSessions) {
        //     let wppclient: Whatsapp;
        //     create({
        //         session: _session.pushname, 
        //         useChrome: false,
        //         autoClose: 180000,
        //         puppeteerOptions: {
        //             userDataDir: path.join(rootDir, 'tokens', _session.sessionID),
        //           },
        //     })
        //     .catch(()=>
        //         console.log('çajfdlkçasjflasjflçsdjfskdfjasdçlkfjsdklf')
        //     )
        //     .then((client) => {
        //         wppclient = client as Whatsapp;
        //         console.log('wppclient .........',wppclient);
        //         if(wppclient){
        //             wppClients.set(_session.number, wppclient) // Store wppclient in the map
        //             console.log('wppclient saved...................');
        //         }
        //     })
        // }

        console.log('saiu do loop');
    });
    app.get('/get-session-token', async (req, res) => {
        const{number} = req.body;
        const client = wppClients.get(number);
        try{
            const session_token: SessionToken | undefined= await client?.getSessionTokenBrowser();
            if(session_token){
                const token =  session_token.WABrowserId;
                res.json(token);
                console.log(session_token);
            }
            
        }catch(error:unknown){
            console.error(error);
            res.json('error');
        }
    }); 

    app.get('/list-chats', async(req, res)=>{
        try{
            if(client){
                const chats = await client?.listChats();
                console.log('chats length..........', chats?.length);
                res.json(chats);
            }
            else{
                res.json('client not found');
                console.log('client not found');
            }
        }catch(error: unknown){
            console.error(error);
            res.json('erro');
        }
    });

    app.get('/list-messages', async (req, res) => {
        const { phoneNumber, messageId, isGroup } = req.body;
        let chatId: string=''
        chatId = phoneNumber + '@c.us';
        if(isGroup){
            chatId = phoneNumber;
        }
    
        try {
         
            const startTime = Date.now(); // Marca o tempo inicial
            const messages = await client?.getMessages(chatId, messageId ?{count:-1, id:messageId} :{ count: 10 })
            
            for(const msg of messages){
                if(msg.hasReaction){
                    const reactions = await client?.getReactions(msg.id);
                    for (const reaction of reactions.reactions){
                        console.log('REACTION:   ', reaction);
                        console.log('SENDERS:   ', reaction.senders)
                    }
                }
            }
            
            const endTime = Date.now(); // Marca o tempo final
    
            const elapsedTime = endTime - startTime; // Calcula o tempo decorrido em milissegundos
            
            //console.log(messages);
            console.log(`Tempo decorrido para getMessages: ${elapsedTime}ms`);
            console.log('messages length.......', messages?.length);
            
            res.json({ messages, elapsedTime });
        } catch (error) {
            console.error('Erro ao listar mensagens:', error);
            res.status(500).json({ error: `Ocorreu um erro: ${error}` });
        }
    })
    app.get('/debug-getMessageId', async (req, res) => {
        const { messageId } = req.body;
        try {
            const message = await client?.getMessageById(messageId);
            console.log(message);
            res.json(message ? message : 'message not found');
        } catch (error) {
            console.error('Erro ao listar mensagens:', error);
            res.status(500).json({ error: `Ocorreu um erro: ${error}` });
        }
    })
    
    app.get('/list-all-messages', async (req, res) => {
        try {
            let sum = 0;
            console.log('⭐⭐ LIST ALL MESSAGES ⭐⭐');
    
            const chats = await client?.listChats();
            const startTime = Date.now(); // Marca o tempo inicial

            for (const chat of chats) {
                const messages = await client?.getMessages(chat.id._serialized, { count: 100000 });
    
    
                console.log(`chatId: ${chat.id._serialized}, messages count........ ${messages?.length}`);
                sum += messages?.length || 0;
                console.log('sum..........', sum);
            }
            const endTime = Date.now(); // Marca o tempo final

            const elapsedTime = endTime - startTime; // Calcula o tempo decorrido em milissegundos

            console.log(`Tempo total decorrido: ${elapsedTime}ms`);
            res.json({ chats, totalMessages: sum, totalElapsedTime: elapsedTime });
        } catch (error: unknown) {
            console.error(error);
            res.json('erro');
        }
    });
    

    app.get('/get-file', async(req, res) => {
        const {isMediaDownload, messageId} = req.body;

        try{
            const message = await client?.getMessageById(messageId);
            console.log(message);
            console.log('⬆️ ⬆️  MESSAGE ⬆️ ⬆️');
            let fileBuffer = Buffer.from('');
            
            const mediaBase64 = await client?.downloadMedia(message)
    
            fileBuffer = Buffer.from(mediaBase64.split(';base64,')[1], 'base64');
            const fileExtension = message.mimetype.includes('codecs=opus') ? 'ogg' :  message.mimetype.split('/')[1];
            console.log('fileExtension..........', fileExtension);
            
            fs.writeFileSync('file.' + fileExtension, fileBuffer);

            fs.writeFileSync('file.txt',  mediaBase64 );
            console.log('file saved successfully');
            res.json(message);
        }catch(err){
            console.log('error..........', err);
            res.json('error');
        }
    })

    app.get('/iterate-all-messages', async(req, res) => {
        try {
            console.log('⭐⭐ ITERATE ALL MESSAGES ⭐⭐');
            const startTime = Date.now(); // Marca o tempo inicial
            
            const chats = await client?.listChats();
            let sum = 0;
            
            // Use Promise.all para chamadas concorrentes
            const promises = chats.map(async (chat) => {
                const messages = await client?.getMessages(chat.id._serialized, { count: -1 });
        
                console.log(`chatId: ${chat.id._serialized}, messages count........ ${messages?.length}`);
                sum += messages?.length || 0;
                console.log('sum..........', sum);
            });
            
            // Aguardar todas as promessas serem resolvidas
            await Promise.all(promises);
        
            const endTime = Date.now(); // Marca o tempo final
            const elapsedTime = endTime - startTime; // Calcula o tempo decorrido em milissegundos
            console.log(`Tempo total decorrido: ${elapsedTime}ms`);
            res.json({ chats, totalMessages: sum, totalElapsedTime: elapsedTime });
        } catch (error) {
            res.json('error');
        }
        
    })
    app.get('/get-all-messages', async(req, res)=>{
        const { phoneNumber } = req.body;
        const chatId = phoneNumber + '@c.us';

        try{
            const messages = await client?.getAllMessagesInChat(chatId, true, true);
            console.log('messages size: ',messages.length);
            res.json('success');
        }catch (err){
            res.json('error: ' + err);
        } 
    })
    app.get('/get-messageById', async(req, res) => {
        const { phoneNumber, messageId } = req.body;
        if(phoneNumber === undefined && messageId === undefined){
            res.json('phoneNumber and messageId is undefined');
            console.log('phoneNumber and messageId is undefined');
            return;
        }
        console.log('msgId..........', messageId ?? phoneNumber);
        try{
            const message = await client?.getMessageById(phoneNumber ?? messageId);
            console.log(message);
            res.json(message);
        }catch(e){
            console.log(e)
            res.json('error');
        }
    })

    app.post('/OnAnyMessage', async (req, res)=>{
        if(onAnyMessageSet){
            res.json('onAnyMessage already set');
            return;
        }
        client?.onAnyMessage((message: Message)=>{
            console.log(message);
            console.log('message received');
        })
        onAnyMessageSet = true
    })

    app.post('/onAck', async(req, res)=>{
        if(onAckSet){
            res.json('onAck already set');
            return;
        }
        
        client?.onAck((ack: Ack)=>{
            console.log(ack);
            console.log(ack.ack)
            console.log('ack received');
        })
        onAckSet = true

    })

    app.post('/onStateChange', async (req, res)=>{
        if(onStateChangeSet){
            res.json('onStateChange is already set');
            return;
        }
        client?.onStateChange((state: SocketState)=>{
            console.log(state);
            socketState = state;
            console.log('stete changed');
        })
        onStateChangeSet = true
        res.json('onStateChange set');
    })

    app.get('/get-list-message', async(req, res)=>{
        const { phoneNumber } = req.body;
        const chatId = phoneNumber + '@c.us';

        try{
            const messages = await client?.sendListMessage(chatId, {
                buttonText: 'Opções',
                description: 'Selecione uma das opções abaixo: ',
                sections: [
                    {
                        title: 'section 1 title',
                        rows:[
                            {
                                rowId: '1',
                                title: 'row1 title',
                                description: 'row2 description'
                            },  
                            {
                                rowId: '2',
                                title: 'row2 title',
                                description: 'row2 description'
                            }
                        ]
                    },
                    {
                        title: 'section 2 title',
                        rows:[
                            {
                                rowId: '1',
                                title: 'row1 title',
                                description: 'row2 description'
                            },  
                            {
                                rowId: '2',
                                title: 'row2 title',
                                description: 'row2 description'
                            }
                        ]
                    }
                ]
            });
            console.log(messages);
            res.json(messages);
        } catch(err) {
            console.error(err);
            res.json('error: ' + err);
        }

    });
    app.get('/get-host-infos', async (req, res)=>{
        try{
            if(client){
                const isConnected = await client?.isConnected();
                const isLoggedIn = await client?.isLoggedIn();
                const hostdevice = await client?.getHostDevice();

                const hostInfos = {
                    "SocketState": socketState,
                    "isConnected": isConnected,
                    "isLoggedIn": isLoggedIn,
                    "hostdevice": hostdevice
                }
                console.log(hostInfos);
                res.json(hostInfos);
            }
            else{
                res.json('client not found');
                console.log('client not found');
            }
        }catch(err){
            console.error(err);
            res.json('error: ' + err);
        }
    })
    app.get('/get-profile-pic', async(req, res)=>{
        const { phoneNumber } = req.body;
        try{
            const profilePic = await client?.getProfilePicFromServer(phoneNumber + '@c.us');
            
            console.log(profilePic);
            res.json(profilePic);
        }catch(err){
            console.error(err);
            res.json('error: ' + err);
        }
    })
    app.get('/get-contact', async(req, res)=>{
        const { phoneNumber } = req.body;
        try{
            const contact = await client?.getContact(phoneNumber + '@c.us').catch((e)=>{console.log(e)});
            if(contact){
                console.log()
            }
            console.log(contact);
            res.json(contact);
        }catch(err){
            console.error(err);
            res.json('error: ' + err);
        }
    })
    app.get('/check-number', async(req, res)=>{
        const { phoneNumber } = req.body;
        try{
            const numberChecked = await client?.checkNumberStatus(phoneNumber + '@c.us');
           
            console.log(numberChecked);
            res.json(numberChecked);
        }catch(err){
            console.error(err);
            res.json('error: ' + err);
        }
    })
    app.get('/get-all-contact',async (req, res)=>{
        const { phoneNumber } = req.body;
        try{
            const allcontacts = await client?.getAllContacts();
            const my_contacts = allcontacts.filter((contact)=>contact.isMyContact)
            console.log(my_contacts);
            res.json(my_contacts);
        }
        catch{
            res.json('error');
        }
    })
    app.get('/get-contact-status', async (req, res)=>{
        const {phoneNumber} = req.body;
        try{
            const contactStatus = await client?.getStatus(phoneNumber + '@c.us');
            console.log(contactStatus);
            res.json(contactStatus);
        }catch{
            res.json('error')
        }
    })
    app.get('/get-contact-infos', async (req,res)=>{
        const {phoneNumber} = req.body;
        try {
            if (!client) return null
            const contactId = phoneNumber + '@c.us'
            if (contactId.endsWith('@c.us')) {
              const checkNumber = await client.checkNumberStatus(contactId)
              if (checkNumber.status === 404 || !checkNumber.numberExists)
                throw new Error('Contact not found')
            }
        
            const photo = await client.getProfilePicFromServer(contactId)
            const photoUrl = photo.eurl
        
            const contact = await client.getContact(contactId)
            const phone = contactId.split('@')[0]
            const name = contact?.formattedName ?? phone
            
            res.json({ photoUrl, name, phone })
            return { photoUrl, name, phone }
          } catch (e) {
            console.log('error in helpers infos:  .....', e)
            res.json('error' + e)
            return null
          }
    })
    app.get('/get-profile-status', async (req, res)=>{
        try{
            const profileStatus = await client?.getProfileStatus();
            console.log(profileStatus);
            res.json(profileStatus);
        }catch{
            res.json('error');
        }
    })
    app.post('/onReaction', async (req, res)=>{
        if(onReactionSet){
            res.json('onReaction already set');
            return;
        }
        client?.onReactionMessage((reaction)=>{
            console.log(reaction);
            console.log('reaction received');
        })
        res.json('onReaction set');
        onReactionSet = true
    })
    app.get('get-reactions', async (req, res)=>{
        const { phoneNumber } = req.body;
        try{
            const reactions = await client?.getReactions(phoneNumber);
            console.log(reactions);
            res.json(reactions);
        }catch{
            res.json('error');
        }
    })
}

app.listen(port, () => {
    console.log('rodando na porta ' + port);
});
