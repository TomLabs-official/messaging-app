const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// username -> socket ID
const users = new Map();

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // User joins
    socket.on("join", (username) => {
        username = username.trim();

        if (!username) {
            socket.emit("joinError", "Username cannot be empty.");
            return;
        }

        if (users.has(username)) {
            socket.emit("joinError", "That username is already being used.");
            return;
        }

        socket.username = username;
        users.set(username, socket.id);

        socket.emit("joined", {
            username
        });

        io.emit("userList", Array.from(users.keys()));

        io.emit("systemMessage", {
            message: `${username} joined the chat.`
        });

        console.log(`${username} joined.`);
    });

    // General chat
    socket.on("generalMessage", (message) => {
        if (!socket.username) return;

        message = message.trim();

        if (!message) return;

        io.emit("generalMessage", {
            username: socket.username,
            message,
            time: new Date().toLocaleTimeString()
        });
    });

    // Private message
    socket.on("privateMessage", ({ recipient, message }) => {
        if (!socket.username) return;

        recipient = recipient.trim();
        message = message.trim();

        if (!recipient || !message) return;

        const recipientSocketId = users.get(recipient);

        if (!recipientSocketId) {
            socket.emit("privateError", `User "${recipient}" is not online.`);
            return;
        }

        const privateMessage = {
            sender: socket.username,
            recipient,
            message,
            time: new Date().toLocaleTimeString()
        };

        // Send to recipient
        io.to(recipientSocketId).emit("privateMessage", privateMessage);

        // Send a copy back to sender
        socket.emit("privateMessage", privateMessage);
    });

    // Disconnect
    socket.on("disconnect", () => {
        if (!socket.username) return;

        users.delete(socket.username);

        io.emit("userList", Array.from(users.keys()));

        io.emit("systemMessage", {
            message: `${socket.username} left the chat.`
        });

        console.log(`${socket.username} disconnected.`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});