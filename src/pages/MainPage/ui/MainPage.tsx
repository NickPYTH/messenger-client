import {Flex, notification} from 'antd';
import {LeftMenu} from './LeftMenu/LeftMenu';
import {ChatWindow} from './ChatWindow/ChatWindow';
import {useEffect, useRef, useState} from 'react';
import {userAPI} from "../../../service/UserService";
import {useDispatch, useSelector} from "react-redux";
import {setCurrentUser} from "../../../store/slice/GeneralSlice";
import { RootStateType } from '../../../store/store';
import { wsHost } from '../../../shared/config/constants';

declare global {
    interface Window {
        electronAPI: {
            executeCommand: (command: string) => Promise<string>;
        };
    }
}

const RECONNECT_INTERVAL = 15000; // 15 секунд
const MAX_RECONNECT_ATTEMPTS = 10; // Максимальное количество попыток переподключения

const MainPage = () => {

    // Store
    const dispatch = useDispatch();
    const selectedConversationId = useSelector((state: RootStateType) => state.currentUser.selectedConversationId);
    // -----

    // States
    const [messagesWs, setMessagesWs] = useState<WebSocket | null>(null);
    // -----

    // Web requests
    const {
        data: currentUserData,
        isLoading: isCurrentUserLoading,
        error: currentUserError,
        refetch: refetchCurrentUser
    } = userAPI.useGetCurrentQuery();
    // -----

    // Effects
    useEffect(() => {
        if (currentUserData) {
            dispatch(setCurrentUser(currentUserData))
        }
    }, [currentUserData, dispatch]);

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.executeCommand('echo "Приложение запущено!"')
                .then(result => alert('Команда выполнена:' + result))
                .catch(error => alert('Ошибка:' + error));
        }
    }, []);

    // WebSocket effect - один раз при монтировании
    useEffect(() => {
        let isMounted = true;
        let socket: WebSocket | null = null;
        let reconnectTimer: NodeJS.Timeout | null = null;
        let reconnectAttempts = 0;
        let isConnecting = false;

        const connect = () => {
            if (!isMounted || isConnecting) return;

            isConnecting = true;
            console.log(`Подключение WebSocket (попытка ${reconnectAttempts + 1})`);

            try {
                socket = new WebSocket(`${wsHost}/ws/messages/`);

                socket.onopen = () => {
                    if (!isMounted) {
                        socket?.close();
                        return;
                    }

                    console.log('WebSocket connected');
                    isConnecting = false;
                    reconnectAttempts = 0;

                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }

                    setMessagesWs(socket);
                };

                socket.onmessage = (event) => {
                    if (!isMounted) return;
                    // Обработка сообщений
                };

                socket.onclose = () => {
                    if (!isMounted) return;

                    console.log('WebSocket disconnected');
                    isConnecting = false;
                    setMessagesWs(null);

                    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        reconnectAttempts++;
                        console.log(`Переподключение через ${RECONNECT_INTERVAL/1000} секунд...`);

                        reconnectTimer = setTimeout(connect, RECONNECT_INTERVAL);
                    }
                };

                socket.onerror = (error) => {
                    if (!isMounted) return;

                    console.error('WebSocket error:', error);
                    isConnecting = false;
                };

            } catch (error) {
                if (!isMounted) return;

                console.error('Failed to create WebSocket:', error);
                isConnecting = false;

                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    reconnectTimer = setTimeout(connect, RECONNECT_INTERVAL);
                }
            }
        };
        connect();
        return () => {
            console.log('Очистка WebSocket');
            isMounted = false;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (socket) {
                socket.close();
            }
        };
    }, []);

    return(
        <Flex style={{background: '#d8e3f4', height: '100vh', overflow: 'hidden'}}>
            <LeftMenu />
            {selectedConversationId && <ChatWindow />}
        </Flex>
    )
}

export default MainPage;
