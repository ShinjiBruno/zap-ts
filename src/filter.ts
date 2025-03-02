/*--------typebot response filters-------*/
interface Message {
  type: string;
  content?: {
    richText?: Array<{
      children: Array<{
        type: string;
        text?: string;
        children?: Array<{
          children: Array<{ text: string }>;
        }>;
      }>;
    }>;
    url?: string;
  };
}

interface Input {
  type: string;
  items?: Array<{
    content: string;
    type: string;
    labels?: Array<{ placeholder: string }>;
  }>;
  options?: Array<{
    type: string;
    labels?: Array<{ placeholder: string }>;
  }>;
}

interface TypebotData {
  messages: Message[];
  input: Input;
}

// bubbles filter
const filterBubble = (data: any) => {
  return data.messages.flatMap((message: any) => {
    let msg = '';
    let typeContent = '';
    if (message.type === 'text' && message.content && message.content.richText) {
      message.content.richText.flatMap((paragraph: any) => {
        paragraph.children.flatMap((child: any) => {
          if (child.type === 'inline-variable' && child.children) {
            child.children.flatMap((inlineChild: any) =>
              inlineChild.children.map((inlineGrandChild: any) => {
                msg += inlineGrandChild.text + ' \n';
              })
            );
          } else if (child.text) {
            msg += child.text + ' \n';
          }
        });
      });
      typeContent = 'text';
    } else if (['image', 'video', 'embed'].includes(message.type) && message.content && message.content.url) {
      //console.log('debug', message.content.url);
      msg += message.content.url;
      typeContent = message.type;
    }
    if (msg.includes('\n')) {
      msg = msg.substring(0, msg.lastIndexOf('\n'));
    }
    return [
      {
        content: msg,
        typeMessage: 'message',
        typeContent: typeContent,
      },
    ];
  });
};

// input filters
const filterInput = (data: any) => {
  // tipos de entrada válidos
  const validTypes = ['email input', 'number input', 'text input', 'url input', 'date input'];

  if (data.input.type === 'choice input') {
    if (!data.input.items) {
      return [];
    }

    if (Array.isArray(data.input.items) && data.input.items.length > 0) {
      return data.input.items.flatMap((input: any) => {
        // Verifica se o tipo é válido e se há labels
        if (input.content) {
          return {
            content: input.content,
            typeMessage: 'input',
            typeContent: data.input.type,
          };
        }
      });
    } else {
      const message = data.input.items[0];
      const type = data.input.type;
      // Verifica se o tipo é válido e se há labels
      if (message.content) {
        return [
          {
            content: message.content,
            typeMessage: 'input',
            typeContent: type,
          },
        ];
      }
    }
    return [];
  }

  if (!data.input.options || !data.input.items) {
    return [];
  }

  // Verifica se options é um array
  if (Array.isArray(data.input.options) && data.input.options.length > 0) {
    return data.input.options.flatMap((input: any) => {
      // Verifica se o tipo é válido e se há labels
      if (validTypes.includes(input.type) && input.labels) {
        return input.labels.map((label: any) => ({
          content: label.placeholder,
          typeMessage: 'input',
          typeContent: input.type,
        }));
      }
      return [];
    });
  } else {
    const message = data.input.options[0];
    const type = data.input.type;
    if (validTypes.includes(type) && message && message.labels) {
      return message.labels.map((label: any) => ({
        content: label.placeholder,
        typeMessage: 'input',
        typeContent: type,
      }));
    }
    return [];
  }
};

export { filterBubble, filterInput };
