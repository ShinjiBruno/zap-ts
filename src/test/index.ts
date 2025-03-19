import { initWpp, wppAPIs } from "./wpp";
import { Chat } from "./chat";
import { ChatManager } from "./chatManager";
import { initWASocket, waSocketAPIs } from "./baileys";

const chatManager = new ChatManager();
main();

async function main(){
  // await initWpp()
  // .then((client: any)=>{
  //   Chat.client = client;
  // })
  // .catch();
  
  // await chatManager.monitorChats();
  //wppAPIs();
  waSocketAPIs();
}