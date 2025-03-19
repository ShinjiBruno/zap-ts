import {WAJS} from '@wppconnect-team/wppconnect';
import { Chat } from './chat';

import fs from 'fs';

/*--Initialization--*/
let sessionId: string = '';
let list_msg: any[] = [];  //TODO: especificar tipo
let list_input_msg: any[] = [];  //aqui tbm

function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }
  function saveBufferToFile(filename: string, buffer: Buffer): void {
    fs.writeFileSync(filename, buffer);
  }
  // Gera uma string aleatória -> é usada para salvar arquivos recebidos
  function createRandomString(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export class ChatManager {    
    public chatsWhatsList: Array<any> = new Array<any>();
    public chatsList: Array<Chat> = new Array<Chat>();
    private chatNow: Chat | null = null;
    private lastLoadedUser: string = '';

    public searchChatId(chatId: string): boolean{
        let chatIndex = this.chatsWhatsList.findIndex((chat)=>{chat.getClientId() == chatId});
        if(chatIndex != -1){
            this.chatsWhatsList[chatIndex].loadChat(chatId);
        }
        return chatIndex != -1;
    }

    public async monitorChats() {
        if(!Chat.client){   return; }

        await this.checkChatIdList();   
        await Chat.client.setOnlinePresence(false);
        //teste
        const pushName = (await Chat.client.getHostDevice()).pushname;
        const id = await Chat.client.getWid();
        const _number = id.substring(0, id.indexOf('@'));
        console.log('name: ...........', pushName);

        Chat.client.onAnyMessage(async (message) => {
            const type = message.type;
            const chatId = message.chatId;
            var from = message.from;
            console.log(message);
            console.log('/////////////////////////////////////////');

            if (!chatId.toString().includes('status')) {
                switch (type) {
                    case 'chat':
                        const msg : any = message.body;
                        var _chat = this.getChat(from);
                        if(_chat !== undefined){
                            var chatFound = this.chatsList.find((chat)=>{ return chat.getClientId() === _chat.id._serialized; });
                            if(chatFound !== undefined){
                                console.log('achouuu', chatFound.getClientId());
                                this.chatNow = chatFound;
                            }
                            else{
                                this.chatNow = new Chat(_chat.id._serialized, _chat.id.user, message.fromMe ? 'bot' : 'bot');
                                this.chatsList.push(this.chatNow);
                            }
                            this.chatNow.getAllMessages().push(message);
                        }
                        else { return; }

                        if(!message.fromMe){
                            console.log('msg', msg);
                            console.log('session', this.chatNow.getSessionId());
                            if (msg && this.chatNow.getSessionId() !== undefined && this.chatNow.getSessionId() !== '') {
                                await this.chatNow.continueChatBot(msg);
                            } else {
                                await this.chatNow.startChatBot();
                                console.log(list_msg.length);
                            }
                            list_msg = this.chatNow.getNewMessages();
                            list_input_msg = this.chatNow.getNewInputMessage();
                        }
                        else{///DEBUGGING
                            if(this.lastLoadedUser)
                                this.loadMoreListChats(5, this.lastLoadedUser);
                            else{
                                //
                            }
                        }

                        for (let i = 0; i < list_msg.length; i++) {
                            const element = list_msg[i];
                            if (isValidUrl(element.content) && element.typeContent === 'image') {
                                const filePath = createRandomString(10) + '.png';
                                await this.chatNow.sendFileMessage(element.content, filePath);
                            } else {
                                await this.chatNow.sendTextMessage(element.content);
                            }
                        }

                        let list_choice: any[] = []; 
                        list_input_msg.forEach(async (element: any) => { 
                            if (element.typeContent == 'choice input') {
                                list_choice.push({ "text": element.content });
                            }
                            console.log(element.content);
                        });
                        if (list_choice.length > 0) {
                            await Chat.client.sendText(from, '', {
                                //useTemplateButtons: true,
                                buttons: list_choice
                            });
                        }
                        this.chatNow.cleanLists();
                        list_msg = [];
                        list_input_msg = [];
                        break;

                    case 'image':
                        try {
                            // Baixar imagem
                            const filename = createRandomString(10) + '.png';
                            //const file = await Chat.client.decryptFile(msg);
                            //saveBufferToFile(filename, file); NAO DELETAR AINDA
                        } catch (error) {
                            console.error(error);
                        }
                        break;
                    case 'ptt':
                        try{
                            const audio_filename = createRandomString(10) + '.mp3';
                            const file = await Chat.client.decryptFile(message);
                            saveBufferToFile(audio_filename, file);

                        }catch{}
                        break;
                    default:
                        break;
                }
            }
        });
     
    }  
    private async loadMoreListChats(more: number, phoneNum: string){
        if (!phoneNum) {
            console.error("phoneNum is undefined or null");
            return;
        }
        var serv = '';
        if(phoneNum.length <= 12){ serv = '@c.us';}
        else { serv = '@g.us';}
        var _id = {
            user: phoneNum + serv,
            server: 'c.us',
            _serialized: phoneNum + serv
        } as WAJS.whatsapp.Wid;
        console.log('passou aqui para carregar mais conversa');
        await Chat.client.listChats({count: more, direction: "after", id: _id})
        .then((chats: any) => {
            chats.forEach((chat: any) => {
                this.chatsWhatsList.push(chat);
                this.lastLoadedUser = chat.id.user;
            })
        })
        .catch();
    }

    private async checkChatIdList(){
        var count = 0;
        var limit = 5;
        await sleep(2000);

        await Chat.client.listChats()
        .then((chats: any) => {
            chats.forEach((chat: any) => {
                if(count++ < limit){
                    console.log(chat);
                    this.chatsWhatsList.push(chat);
                    this.lastLoadedUser = chat.id.user;
                }
            })
        })
        .catch((error: any) => console.error(error));
    }
    private getChat(chatId: string){
        console.log(chatId);
        console.log(this.chatsWhatsList.length);
        return this.chatsWhatsList.find((chat) => {
             
            return chat.id._serialized == chatId;
        });
    }
}