// a_websocket/index.js
import { io } from "socket.io-client";
import { BASE_URL } from "../utils";

export const usersSocket = io(`${BASE_URL}/users`, {
    path: "/ws/socket.io",
    transports: ["websocket"],
    withCredentials: true,
});

export const notificationsSocket = io(`${BASE_URL}/notifications`, {
    path: "/ws/socket.io",
    transports: ["websocket"],
    withCredentials: true,
});

usersSocket.on("connect", () => {
    console.log("✅ Connected to WebSocket server");
});

usersSocket.on("disconnect", () => {
    console.log("❌ Disconnected from WebSocket server");
});




