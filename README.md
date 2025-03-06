# Zap-TS

This repo allows testing the functions of the WppConnect library through API requests to custom endpoints using Express.js.

## Features

- **Testing with the WppConnect library**: Allows testing various functions of the WppConnect library.
- **Integration with Typebot**: Monitors messages received on WhatsApp and interacts with Typebot.

## Configuration

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ShinjiBruno/zap-ts.git
   cd zap-ts
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a [.env](https://github.com/ShinjiBruno/zap-ts/blob/main/.env.example) file in the root of the project and add the environment variables as specified in the [.env.example](https://github.com/ShinjiBruno/zap-ts/blob/main/.env.example) file:
   ```properties
   TYPEBOT_TOKEN='YOUR_TYPEBOT_TOKEN'
   TYPEBOT_PUBLICID='YOUR_TYPEBOT_PUBLIC_ID'
   TYPEBOT_URL='YOUR_TYPEBOT_URL'
   ```

### Usage

1. Start the server:

   ```bash
   npm start
   ```

2. Access the endpoints defined in the [wpp.ts](https://github.com/ShinjiBruno/zap-ts/blob/main/src/wpp.ts) file to interact with the API.

### Endpoints

The endpoints are defined in the `wppAPIs` method in the [wpp.ts](https://github.com/ShinjiBruno/zap-ts/blob/main/src/wpp.ts) file. Here are some examples:

- **POST /connect-session**: Connects a new session.
- **POST /connect-and-post**: Connects a new session and posts a message.
- **GET /list-chats**: Lists all chats.
- **GET /list-messages**: Lists all messages of a specific chat.
- **GET /get-session-token**: Retrieves the session token.
- **GET /get-file**: Downloads a file from a specific message.

You can use tools like ThunderClient extension in VSCode to make the requests.

The default URL is `http://localhost:3010`, where the port is defined in `wpp.ts`. You can change it as needed.

### Integration with Typebot

To integrate with Typebot, uncomment the `monitorChat` line in the `index.ts` file and comment out the `wppAPIs()` line. This will start monitoring messages received on WhatsApp. Before that, connect your account as per the instructions above.

## Future Improvements

- Improve integration with Typebot.
- Add more filters for Typebot API responses.
