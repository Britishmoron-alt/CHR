//Sadly, 1.3.2 may be the final version…
//Maybe I’ll update it ONE more time..?
//If I do, imma make a Python version.
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const bannedIps = new Set();
const invisibleUsers = new Set();
const protectedUsers = new Set();
const swearWords = [ 'nigger', 'ass', 'bitch', 'fuck', 'damn', 'dammit', 'cock', 'ass', 'asshole', 'dick', 'fucker', 'shit', 'dammit']; // Add your list of swear words here
const connectedUsers = new Map();
const voteToBanSessions = new Map(); // Store vote sessions, keyed by username
console.log("CHR, Console Version 1.2.2");
console.log("CHR, Server.js Version 1.3.2");
console.log("CHR, UI Version 1.1.3");
console.log("CHR, MSGSys Version 1.3.2");
console.log("CHR, SERVER STATUS: Loading.");
console.log("Loading UI...");
console.log("Complete, moving to next stage.");
console.log("Loaded commands");
console.log("Loading Server...");
console.log("Loaded.");
console.log("CHR, SERVER STATUS: Loaded.");
console.log("Starting...");
console.log("Server ready");
console.log("Server is ready to be started on ngrok");
console.log("Server is starting the command list...");
console.log("Command list ready");
console.log("Checking other variables...");
console.log("Do people even read these?");
console.log("Ready");
console.log("Started.");
const commandsList = `
Available commands:
/list - List all commands
---$ban <username> - Ban a user
---$unban <username> - Unban a user
---$unbanme - Unban yourself
---$invis <username> - Make a user invisible
---$banprot <username, @s for self> - Add ban protection to a user
---$remove <invis, banprot> <username> - Remove invisibility or ban protection from a user
---$fakeuser <username> - Create a fake user (May not always work)
---$banall - Ban all users except those with ban protection
---$<name> say <message> x<times> - This command was removed, due to users spamming, then crashing the server irreparably.
---$chatbot-say <message> x<times> - This command was removed, due to users spamming, then crashing the server irreparably.
---$mute <username> - Mute a user - In development.
---$unmute <username> - Unmute a user - In development.
---$kick <username> - Kick a user
---$warn <username> <message> - Send a warning to a user
---$broadcast <message> - Send a message to all users
---$pm <username> <message> - Send a private message to a user
One other command would be listed, but it is admin only, due to possible chaos. It is the ban voting. Pretty much vote-to-kick. To request a ban vote, type "---$pm System_1.2.1/Server/Admin Requesting a banvote on So-and-so."
`;
//The other command is: ---$voteban <username>
io.on('connection', (socket) => {
    const clientIp = socket.request.connection.remoteAddress;
    console.log("Connected, Checking Ip");
    if (bannedIps.has(clientIp)) {
        socket.emit('banned');
        console.log(`{$clientIp} is banned`);
        console.log("Wonder why that user's banned...");
        socket.disconnect();
        console.log("The banned user was disconnected.");
        return;
    }

    console.log('A user connected');

    // Check if the user is banned
    socket.on('set name', (name) => {
        if (bannedIps.has(clientIp)) {
            socket.emit('banned');
            socket.disconnect();
        } else {
            socket.username = name;
            connectedUsers.set(socket.id, { name, ip: clientIp });
            io.emit('user list', Array.from(connectedUsers.values()).filter(user => !invisibleUsers.has(user.name)).map(user => user.name));
        }
    });

    // Handle chat messages and commands
    socket.on('chat message', (msg) => {
        if (socket.username && msg.startsWith('/list')) {
            console.log("A user has requested admin command list.");
		console.log("User commmand list displayed.");
            socket.emit('chat message', { user: 'System_1.2.1/AdminList', text: commandsList });
        } else if (socket.username && msg.startsWith('---$ban ')) {
            const userToBan = msg.split(' ')[1];
            if (userToBan && !protectedUsers.has(userToBan)) {
                let userIp = null;
                for (let [id, user] of connectedUsers) {
                    if (user.name === userToBan) {
                        userIp = user.ip;
                        break;
                    }
                }
                if (userIp) {
			//Version of Chatroom is generally higher than System because System is console log.
			//Also, there is one other thing that may not be up-to-date.
			//The Console. Most of the time, the Console will always have a younger version, as it
			//Is just the stuff reported into the Terminal.
                    bannedIps.add(userIp);
                    io.emit('chat message', { user: 'System_1.2.1/Ban', text: `${userToBan} has been banned.`, color: 'red' }); // Message in red
                    for (let [id, user] of connectedUsers) {
                        if (user.ip === userIp) {
                            io.to(id).emit('banned');
                            io.sockets.sockets.get(id).disconnect();
				console.log("Banning Process Init");
                            connectedUsers.delete(id);
                            console.log("A user has been banned. See UI for username.");
                        }
                    }
                    io.emit('user list', Array.from(connectedUsers.values()).filter(user => !invisibleUsers.has(user.name)).map(user => user.name));
                }
            }
        } else if (socket.username && msg.startsWith('---$banall')) {
            for (let [id, user] of connectedUsers) {
                if (!protectedUsers.has(user.name)) {
                    bannedIps.add(user.ip);
                    io.to(id).emit('banned');
			console.log("Server Status: Nuked");
                    io.emit('chat message', { user: 'System_1.2.1/SERVERNUKE', text: `${user.name} has been banned.`, color: 'red' }); // Message in red
                    io.sockets.sockets.get(id).disconnect();
                    connectedUsers.delete(id);
                }
            }
            io.emit('user list', Array.from(connectedUsers.values()).filter(user => !invisibleUsers.has(user.name)).map(user => user.name));
            io.emit('all users banned except protected');
        } else if (socket.username && msg.startsWith('---$unban ')) {
            const userToUnban = msg.split(' ')[1];
		console.log("Unbanning Process Init");
            if (userToUnban) {
                let userIp = null;
                for (let [id, user] of connectedUsers) {
                    if (user.name === userToUnban) {
                        userIp = user.ip;
                        break;
                    }
                }
                if (userIp && bannedIps.has(userIp)) {
                    bannedIps.delete(userIp);
			console.log("Process Complete");
                    io.emit('chat message', { user: 'System_1.2.1/Ban', text: `${userToUnban} has been unbanned.` });
                }
            }
        } else if (socket.username && msg.startsWith('---$unbanme')) {
            if (bannedIps.has(clientIp)) {
                bannedIps.delete(clientIp);
                io.emit('chat message', { user: 'System_1.2.1/Ban', text: `${socket.username} has been unbanned.`, color: 'blue' });
            }
        } else if (socket.username && msg.startsWith('---$invis ')) {
            const userToInvisible = msg.split(' ')[1];
            if (userToInvisible) {
                invisibleUsers.add(userToInvisible);
                io.emit('user list', Array.from(connectedUsers.values()).filter(user => !invisibleUsers.has(user.name)).map(user => user.name));
            }
        } else if (socket.username && msg.startsWith('---$banprot ')) {
            const userToProtect = msg.split(' ')[1];
            if (userToProtect) {
                const username = userToProtect === '@s' ? socket.username : userToProtect;
                protectedUsers.add(username);
                io.emit('chat message', { user: 'System_1.2.1', text: `${username} is now protected from bans.` });
            }
        } else if (socket.username && msg.startsWith('---$remove banprot ')) {
            const userToUnprotect = msg.split(' ')[2];
            if (userToUnprotect) {
                protectedUsers.delete(userToUnprotect);
                io.emit('chat message', { user: 'System_1.2.1/Ban/Prot', text: `${userToUnprotect} is no longer protected from bans.` });
            }
        } else if (socket.username && msg.startsWith('---$mute ')) {
            const userToMute = msg.split(' ')[1];
            if (userToMute) {
                const userSocketId = Array.from(connectedUsers.keys())
                    .find(id => connectedUsers.get(id).name === userToMute);
                if (userSocketId) {
                    connectedUsers.get(userSocketId).muted = true;
                    socket.emit('chat message', { user: 'System_1.2.1/Manager/Internal/Mute', text: `${userToMute} has been muted.` });
                } else {
                    socket.emit('chat message', { user: 'System_1.2.1/Manager/Internal/Mute/ERROR2', text: `User ${userToMute} not found.` });
                }
            }
        } else if (socket.username && msg.startsWith('---$unmute ')) {
            const userToUnmute = msg.split(' ')[1];
            if (userToUnmute) {
                const userSocketId = Array.from(connectedUsers.keys())
                    .find(id => connectedUsers.get(id).name === userToUnmute);
                if (userSocketId && connectedUsers.get(userSocketId).muted) {
                    delete connectedUsers.get(userSocketId).muted;
                    socket.emit('chat message', { user: 'System_1.2.1/Manager/Internal/Mute', text: `${userToUnmute} has been unmuted.` });
                } else {
                    socket.emit('chat message', { user: 'System_1.2.1/Manager/Internal/Mute/ERROR1', text: `User ${userToUnmute} is not muted or not found.` });
                }
            }
        } else if (socket.username && msg.startsWith('---$kick ')) {
            const userToKick = msg.split(' ')[1];
            if (userToKick) {
                const userSocketId = Array.from(connectedUsers.keys())
                    .find(id => connectedUsers.get(id).name === userToKick);
                if (userSocketId) {
                    io.to(userSocketId).emit('kicked', 'You have been kicked from the server.');
                    io.sockets.sockets.get(userSocketId).disconnect();
                    connectedUsers.delete(userSocketId);
                    io.emit('user list', Array.from(connectedUsers.values()).filter(user => !invisibleUsers.has(user.name)).map(user => user.name));
                }
            }
        } else if (socket.username && msg.startsWith('---$warn ')) {
            const parts = msg.split(' ');
            const userToWarn = parts[1];
            const warningMessage = parts.slice(2).join(' ');
            if (userToWarn && warningMessage) {
                for (let [id, user] of connectedUsers) {
                    if (user.name === userToWarn) {
                        io.to(id).emit('chat message', { user: 'System_1.2.1/ExternalAdmin', text: `Warning: ${warningMessage}` });
                        break;
                    }
                }
            }
        } else if (socket.username && msg.startsWith('---$broadcast ')) {
            const broadcastMessage = msg.slice(14).trim();
            if (broadcastMessage) {
                io.emit('chat message', { user: 'Public Broadcast', text: broadcastMessage });
		    console.log("/External/MSG/Br: Broadcast.");
            }
		//If broadcasted, it is considered External/MSG/Br.
		//Remember, console log is V1.2.2.
		//Other things will have a higher version.
		//Maybe.
        } else if (socket.username && msg.startsWith('---$pm ')) {
		console.log("PrivateMSG/External/MSGmanager: PrivateMsgProcessing");
            const parts = msg.split(' ');
            const recipient = parts[1];
            const privateMessage = parts.slice(2).join(' ');
            if (recipient && privateMessage) {
                for (let [id, user] of connectedUsers) {
                    if (user.name === recipient) {
                        io.to(id).emit('chat message', { user: `Private from ${socket.username}`, text: privateMessage });
			    console.log("PrivateMSG/External/MSGmanager:Sent");
                        break;
                    }
                }
            }
        } else if (socket.username && msg.startsWith('---$voteban ')) {
            const userToVote = msg.split(' ')[1]; // Extract the username
            if (!userToVote || protectedUsers.has(userToVote)) {
                socket.emit('chat message', { user: 'System_1.2.1/BanVote/Error2', text: `Cannot start a vote to ban ${userToVote}: They have ban protection` });
		    console.log("System/Banvote:Error_2//Attempted_protBan");
                return;
            }

            if (voteToBanSessions.has(userToVote)) {
                socket.emit('chat message', { user: 'System_1.2.1/BanVote/ERROR1', text: `A vote to ban ${userToVote} is already in progress.` });
		    console.log("System/Banvote/Error_1//Attempted_Prog_Ban17");
                return;
            }

            // Initialize vote session
            voteToBanSessions.set(userToVote, { yes: 0, no: 0 });

            // Broadcast voting prompt
            io.emit('chat message', { user: 'System_1.2.1/BanVote', text: `Vote to ban ${userToVote}? Type 'Yes' or 'No'. Use capitalized first letters.` });
		console.log("System/Banvote//BanVote_Init_Success");

            // Set a timeout for counting votes
            setTimeout(() => {
                const votes = voteToBanSessions.get(userToVote);
                if (!votes) return; // Session might have been cleared

                voteToBanSessions.delete(userToVote);

                if (votes.yes > votes.no) {
                    // Ban the user
                    let userIp = null;
                    for (let [id, user] of connectedUsers) {
                        if (user.name === userToVote) {
                            userIp = user.ip;
                            break;
                        }
                    }
                    if (userIp) {
                        bannedIps.add(userIp);
                        io.emit('chat message', { user: 'System_1.2.1/BanVote', text: `${userToVote} has been banned.`, color: 'red' }); // Message in red
                        for (let [id, user] of connectedUsers) {
                            if (user.ip === userIp) {
                                io.to(id).emit('banned');
                                io.sockets.sockets.get(id).disconnect();
                                connectedUsers.delete(id);
                            }
                        }
                        io.emit('user list', Array.from(connectedUsers.values()).filter(user => !invisibleUsers.has(user.name)).map(user => user.name));
                    }
                    io.emit('chat message', { user: 'System_1.2.1/BanVote', text: `${userToVote} has been banned by majority vote.` });
                } else {
                    io.emit('chat message', { user: 'System_1.2.1/BanVote/ERROR3', text: `Vote to ban ${userToVote} failed.`, color: 'purple' });
                }
            }, 30000); // 30-second voting period
        } else if (msg === 'Yes' || msg === 'No') {
            // Handle votes
            for (let [userToVote, votes] of voteToBanSessions) {
                votes[msg.toLowerCase()]++;
                break; // Each user can only vote once per session
            }
        } else if (socket.username) {
            const user = connectedUsers.get(socket.id);
            if (user && user.muted) {
                socket.emit('chat message', { user: 'System_1.2.1/MSG/ERROR1', text: 'You are muted and cannot send messages.' });
                return;
            }

            const containsSwearWord = swearWords.some(word => msg.includes(word));
            if (containsSwearWord) {
                bannedIps.add(clientIp);
                io.emit('chat message', { user: 'System_1.2.1/Ban', text: `${socket.username} has been banned.`, color: 'red' }); // Message in red
                socket.emit('banned');
                connectedUsers.delete(socket.id);
                socket.disconnect();
            } else {
                const message = { user: socket.username, text: msg };
                io.emit('chat message', message);
            }
        }
    });

    socket.on('disconnect', () => {
        connectedUsers.delete(socket.id);
        io.emit('user list', Array.from(connectedUsers.values()).filter(user => !invisibleUsers.has(user.name)).map(user => user.name));
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 4567;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("Note that the port may vary depending on how it was hosted.");
});


