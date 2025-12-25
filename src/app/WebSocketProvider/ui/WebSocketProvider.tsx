// context/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import ReduxProvider from "../../ReduxProvider/ui/ReduxProvider";

interface WebSocketContextType {
    sendMessage: (data: any) => void;
    isConnected: boolean;
    registerHandler: (type: string, handler: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const WebSocketProvider: React.FC<{
    children: React.ReactNode;
    url: string;
    onConnectionChange?: (connected: boolean) => void;
}> = ({ children, url, onConnectionChange }) => {
    const socketRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map());
    const [isConnected, setIsConnected] = useState(false);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;
    const reconnectInterval = 15000;

    // Функция подключения
    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN ||
            socketRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        try {
            const socket = new WebSocket(url);

            socket.onopen = () => {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
                onConnectionChange?.(true);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const { type } = data;

                    // Вызываем все обработчики для этого типа
                    const typeHandlers = handlersRef.current.get(type) || [];
                    typeHandlers.forEach(handler => handler(data));

                    // Вызываем глобальные обработчики
                    const allHandlers = handlersRef.current.get('*') || [];
                    allHandlers.forEach(handler => handler(data));
                } catch (error) {
                    console.error(error);
                }
            };

            socket.onclose = (event) => {
                setIsConnected(false);
                socketRef.current = null;
                onConnectionChange?.(false);

                // Переподключение
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    //reconnectAttemptsRef.current++;
                    //console.log(`Переподключение через ${reconnectInterval/1000}сек (попытка; ${reconnectAttemptsRef.current})`);
                    //setTimeout(connect, reconnectInterval);
                }
            };

            socket.onerror = (error) => {
                console.error(error);
            };

            socketRef.current = socket;
        } catch (error) {
            console.error(error);
        }
    }, [url, onConnectionChange]);

    // Инициализация при монтировании
    useEffect(() => {
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [connect]);

    // Регистрация обработчиков
    const registerHandler = useCallback((type: string, handler: (data: any) => void) => {
        if (!handlersRef.current.has(type)) {
            handlersRef.current.set(type, []);
        }

        handlersRef.current.get(type)!.push(handler);

        // Возвращаем функцию для удаления обработчика
        return () => {
            const typeHandlers = handlersRef.current.get(type);
            if (typeHandlers) {
                const index = typeHandlers.indexOf(handler);
                if (index > -1) {
                    typeHandlers.splice(index, 1);
                }
            }
        };
    }, []);

    // Отправка сообщений
    const sendMessage = useCallback((data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
            return true;
        } else {
            console.warn('WebSocket не подключен');
            return false;
        }
    }, []);

    return (
        <WebSocketContext.Provider value={{ sendMessage, isConnected, registerHandler }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};

export default WebSocketProvider;
