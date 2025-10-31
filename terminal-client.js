//Still in development, so it isn't going to be as good as the web version. This is more for monitoring the people on web and running command accordingly.
//Install dependencies: npm install socket.io-client
//Run: node terminal-client.js
//NOTE: This will not work yet. Like, at all. Please wait for me to finish making it!
// Simple terminal-based chat client for CHR Chatroom

import readline from 'readline';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4567'); // change if your server runs elsewhere

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let username = '';

function askName() {
  rl.question('Enter your username: ', (name) => {
    username = name.trim() || 'Anonymous';
    socket.emit('set name', username);
    console.clear();
    console.log(`Connected as \x1b[36m${username}\x1b[0m`);
    console.log('-----------------------------------');
    startChat();
  });
}

function startChat() {
  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', (line) => {
    const msg = line.trim();
    if (msg.length > 0) {
      socket.emit('chat message', msg);
    }
    rl.prompt();
  });

  socket.on('chat message', (msg) => {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(`${msg.user}: ${msg.text}`);
    rl.prompt(true);
  });

  socket.on('user list', (users) => {
    console.log('\n\x1b[33m[Users online]\x1b[0m');
    console.log(users.join(', '));
    rl.prompt(true);
  });

  socket.on('banned', () => {
    console.log('\n\x1b[31mYou have been banned.\x1b[0m');
    rl.close();
    socket.disconnect();
  });

  socket.on('kicked', (msg) => {
    console.log(`\n\x1b[31m${msg}\x1b[0m`);
    rl.close();
    socket.disconnect();
  });

  socket.on('disconnect', () => {
    console.log('\n\x1b[31mDisconnected from server.\x1b[0m');
    rl.close();
  });
}

askName();
