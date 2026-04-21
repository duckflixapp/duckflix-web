import { API_URL } from '../config';

const getWsUrl = () => {
    const url = new URL(API_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
};

const wsUrl = getWsUrl();

class SocketManager {
    private ws: WebSocket | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handlers: Map<string, ((data: any) => void)[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect() {
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                return;
            }
        }
        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = (event) => {
            try {
                const { event: evName, data } = JSON.parse(event.data);
                this.handlers.get(evName)?.forEach((handler) => handler(data));
            } catch (err) {
                console.error('WS Parse Error:', err);
            }
        };

        this.ws.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.connect();
                }, 1000);
            }
        };

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            console.log('WS Connected');
        };
    }

    on<T>(event: string, handler: (data: T) => void) {
        if (!this.handlers.has(event)) this.handlers.set(event, []);
        this.handlers.get(event)?.push(handler);
    }

    off(event: string, handler: null | ((data: never) => void) = null) {
        if (handler === null) {
            this.handlers.delete(event);
            return;
        }
        const eventHandlers = this.handlers.get(event);
        if (eventHandlers) {
            this.handlers.set(
                event,
                eventHandlers.filter((h) => h !== handler)
            );
        }
    }

    emit(event: string, data: unknown) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event, data }));
        } else {
            setTimeout(() => this.emit(event, data), 500);
        }
    }

    disconnect() {
        this.ws?.close();
        this.ws = null;
    }

    get connected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const socket = new SocketManager();
export const connectSocket = () => socket.connect();
export const disconnectSocket = () => socket.disconnect();
