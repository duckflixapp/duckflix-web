// hooks/useNotificationListener.ts
import { useEffect } from 'react';
import { socket, connectSocket } from '../lib/socket';

export interface NotificationSocketData {
    movieId?: string;
    movieVerId?: string;
    status: 'started' | 'completed' | 'downloaded' | 'error';
    title: string;
    message: string;
}

export const useNotificationSocket = (callback: (data: NotificationSocketData) => void) => {
    useEffect(() => {
        connectSocket();

        const handler = (data: NotificationSocketData) => callback(data);

        socket.on('notification', handler);

        return () => {
            socket.off('notification', handler);
        };
    }, [callback]);
};
