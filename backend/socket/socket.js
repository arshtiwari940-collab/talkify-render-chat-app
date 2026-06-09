import { Server } from "socket.io";
import http from "http";
import express from "express";
import { corsOriginCallback } from "../utils/cors.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: corsOriginCallback,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") userSocketMap[userId] = socket.id;

    // io.emit() is used to send events to all the connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // WebRTC Signaling
    socket.on("callUser", (data) => {
        const receiverSocketId = getReceiverSocketId(data.userToCall);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incomingCall", { signal: data.signalData, from: data.from, name: data.name });
        }
    });

    socket.on("answerCall", (data) => {
        const callerSocketId = getReceiverSocketId(data.to);
        if (callerSocketId) {
            io.to(callerSocketId).emit("callAccepted", data.signal);
        }
    });

    socket.on("endCall", (data) => {
        const receiverSocketId = getReceiverSocketId(data.to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("callEnded");
        }
    });

    socket.on("typing", (data) => {
        const receiverSocketId = getReceiverSocketId(data.to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", { from: userId });
        }
    });

    socket.on("stopTyping", (data) => {
        const receiverSocketId = getReceiverSocketId(data.to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userStoppedTyping", { from: userId });
        }
    });

    socket.on("markMessagesRead", (data) => {
        const senderSocketId = getReceiverSocketId(data.fromUserId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", {
                messageIds: data.messageIds,
                readBy: userId,
            });
        }
    });

    // socket.on() is used to listen to the events. can be used both on client and server side
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server };
