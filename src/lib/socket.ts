import { io, Socket } from 'socket.io-client';

const apiUrl = new URL(import.meta.env.VITE_API_URL);
const socketUrl = apiUrl.origin;

export const socket: Socket = io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    withCredentials: true,
    transports: ['websocket'],
    upgrade: false,
});

export const connectSocket = () => {
    if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
    if (socket.connected) socket.disconnect();
};
