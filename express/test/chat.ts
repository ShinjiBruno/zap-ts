/*---o que recebe do bot---*/
import { startChat, replyChat } from './typebot';
import {  Whatsapp } from '@wppconnect-team/wppconnect';
import fs from 'fs';
const axios = require('axios');

/*---aux functions---*/
  
  async function downloadImage(url: string, filepath: string): Promise<void> {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
  
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);  
      writer.on('error', reject);   
    });
  }

  function deleteFile(filepath: string): void {
    fs.unlink(filepath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${err.message}`);
      } else {
        console.log(`File deleted successfully: ${filepath}`);
      }
    });
  }
  
  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

/**********************************************/
export class Chat{
    public static client: Whatsapp;
    private clientId: string = '';
    private phoneNumber: string = '';
    private context: string = '';
    private botId: string = '';
    private state: string = '';
    private sessionId: string = '';

    private timerId: NodeJS.Timeout | null = null;

    private allMssgs: Array<any> = new Array<any>(); 
    private newMssgs: Array<any> = new Array<any>();
    private newinputMssgs: Array<any> = new Array<any>();

    public setContext(ctxt: string): void{
        this.context = ctxt;
    }
    public setSessionId(sId: string): void{ this.sessionId = sId; }
    
    public getClientId(): string{ return this.clientId; }
    public getContext(): string{ return this.context; }
    public getSessionId(): string{ return this.sessionId;}
    public getTimer():NodeJS.Timeout | null{ return this.timerId; }
    public getNewMessages(): Array<any>{ return this.newMssgs; }
    public getNewInputMessage(): Array<any>{ return this.newinputMssgs; }
    public getAllMessages(): Array<any>{ return this.allMssgs; }

    constructor(clientId: string, phoneNumber: string, ctxt: string){
        this.clientId = clientId;
        this.phoneNumber = phoneNumber;
        this.context = ctxt;
    }
    /*
     * startChat: only when 'context == bot'
     */
    public async startChatBot() {
        console.log(this.context);
        if(this.context == 'bot'){
            this.sessionId = await startChat(this.newMssgs, this.newinputMssgs);
            this.startTimer();
        }
    }
    public async continueChatBot(content: string){
        if(this.context == 'bot'){
            await replyChat(this.newMssgs, this.newinputMssgs, this.sessionId, content);
            this.resetTimer();
        }
    }

    public async sendTextMessage(content: string){
        console.log('phoneNumber ', this.phoneNumber);
        console.log('Sending message:', content);
        Chat.client.sendText(this.phoneNumber, content);
    }
    public async sendFileMessage(content:string, filePath: string){
        try {
            await downloadImage(content, filePath);
            console.log('Image downloaded');
            await sleep(3000);
            await Chat.client.sendImage(this.phoneNumber, './' + filePath)
            .then(() => {
                deleteFile(filePath);
            })
            .catch((error: any) => console.error(error));
        } catch (error) {
            console.error(error);
        }
    }
    public cleanLists(): void{
        this.newMssgs = [];
        this.newinputMssgs = [];
    }
    
    private checkClientId(cltId: string): boolean{
        //verifica se o cliente eh novo ou nao conferindo a lista de contatos
        
        return true;
    }

    public loadChat(cltId: string) {
        if(this.checkClientId(cltId)){
            
        } else {
            //carrega as mensagens antigas 
        }
    }

    public saveToDB(): void{}

    private startTimer(): void {
        this.clearTimer();
        this.timerId = setTimeout(() => {
            this.sessionId = '';
        }, 1200000); 
    }

    private resetTimer(): void {
        if (this.context == 'bot') {
            this.startTimer();
        }
    }

    private clearTimer(): void {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

}
