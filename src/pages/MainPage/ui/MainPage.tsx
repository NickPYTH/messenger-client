// MainPage.tsx (ваш текущий файл УПРОЩЕННЫЙ)
import {Flex} from 'antd';
import {LeftMenu} from './LeftMenu/LeftMenu';
import {ChatWindow} from './ChatWindow/ChatWindow';
import {useEffect} from 'react';
import {userAPI} from "../../../service/UserService";
import {useDispatch, useSelector} from "react-redux";
import {setCurrentUser} from "../../../store/slice/GeneralSlice";
import {RootStateType} from '../../../store/store';
import {useWebSocket} from "../../../app/WebSocketProvider/ui/WebSocketProvider";

const MainPage = () => {
    const dispatch = useDispatch();
    const selectedConversationId = useSelector((state: RootStateType) => state.currentUser.selectedConversationId);

    // Используем WebSocket из контекста
    const { isConnected, registerHandler, sendMessage } = useWebSocket();

    // Запрос текущего пользователя
    const { data: currentUserData } = userAPI.useGetCurrentQuery();

    // Сохраняем пользователя в Redux
    useEffect(() => {
        if (currentUserData) {
            dispatch(setCurrentUser(currentUserData));
        }
    }, [currentUserData, dispatch]);

    useEffect(() => {
        const removeHandler = registerHandler('message', (data: any) => {
            console.log('Получено сообщение:', data);
            // Если нужно сохранить в Redux
            // dispatch({ type: 'chat/NEW_MESSAGE', payload: data.entity });
        });

        // Обработчик для уведомлений
        const removeNotificationHandler = registerHandler('notification', (data) => {
            console.log('Уведомление:', data);
        });

        // Очищаем при размонтировании
        return () => {
            removeHandler();
            removeNotificationHandler();
        };
    }, [registerHandler]);

    // Отправка тестового сообщения (пример)
    const testSend = () => {
        sendMessage({
            type: 'ping',
            timestamp: Date.now()
        });
    };

    return (
        <Flex style={{ background: '#d8e3f4', height: '100vh', overflow: 'hidden' }}>
            <LeftMenu />
            {selectedConversationId && <ChatWindow />}

            <div style={{
                position: 'fixed',
                bottom: 10,
                right: 10,
                padding: '5px 10px',
                background: isConnected ? 'green' : 'red',
                color: 'white',
                borderRadius: '5px'
            }}>
                {isConnected ? 'Online' : 'Offline'}
            </div>
        </Flex>
    );
};

export default MainPage;