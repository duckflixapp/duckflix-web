import { useEffect } from 'react';
import { socket, connectSocket } from '../lib/socket';

export interface NotificationSocketData {
    videoId?: string;
    videoVerId?: string;
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
