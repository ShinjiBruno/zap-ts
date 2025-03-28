import { filterBubble, filterInput } from './filter';
import dotenv from 'dotenv';

dotenv.config();

const typeBotToken: string = process.env.TYPEBOT_TOKEN || '';
const publicId: string = process.env.PUBLIC_ID || '';
const typebotURL: string = process.env.TYPEBOT_URL || '';


async function startChat(list_msg: any[], list_input_msg: any[]): Promise<string> {
  //const fetch = (await import('node-fetch')).default;
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + typeBotToken,
      'Content-Type': 'application/json'
    },
    body: '{}'
  };
  let sessionId = '';
  try {
    const response = await fetch(`${typebotURL}/api/v1/typebots/${publicId}/preview/startChat`, options);
    const data: any = await response.json();

    sessionId = data.sessionId || '';
    console.log(JSON.stringify(data, null, 2));

    if (data.messages) {
      list_msg.splice(0, list_msg.length, ...filterBubble(data));
    }
    if (data.input) {
      list_input_msg.splice(0, list_msg.length, ...filterInput(data));
    }
  } catch (err) {
    console.error(err);
    sessionId = '';
  }

  return sessionId;
}

async function replyChat(
  list_msg: any[], 
  list_input_msg: any[],
  sessionId: string,
  content: string
): Promise<string> {
  //const fetch = (await import('node-fetch')).default;
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + typeBotToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        type: "text",
        text: content,
        attachedFileUrls: ["<string>"]
      },
      isStreamEnabled: true,
      resultId: "<string>",
      isOnlyRegistering: true,
      prefilledVariables: {
        "First name": "John",
        "Email": "john@gmail.com"
      },
      textBubbleContentFormat: "richText"
    })
  };

  let res = '';

  try {
    const response = await fetch(`${typebotURL}/api/v1/sessions/${sessionId}/continueChat`, options);
    const data: any= await response.json() ;

    if (data.messages) {
      list_msg.splice(0, list_msg.length, ...filterBubble(data));
    }
    if (data.input) {
      list_input_msg.splice(0, list_msg.length, ...filterInput(data));
    }

    res = JSON.stringify(data, null, 2);
    console.log(res);
  } catch (err) {
    console.error(err);
  }

  return res;
}

let input_type: string | null = null;

function getInputType(): string | null {
  return input_type;
}

function setInputType(type: string): void {
  input_type = type;
}

export { startChat, replyChat, getInputType, setInputType };
