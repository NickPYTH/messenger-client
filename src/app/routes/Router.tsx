import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Result } from 'antd';
import { routeConfig } from './routeConfig';
import Receiver from '../../features/receiveScreen/ui/Receiver';

// Компонент-обертка для определения, какой компонент рендерить
const MessengerWrapper: React.FC = () => {
    const location = useLocation();

    // Извлекаем параметр room из query string
    const getRoomParam = () => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('room');
    };

    const room = getRoomParam();

    // Если есть параметр room - рендерим Receiver, иначе MainPage
    if (room) {
        return <Receiver />;
    }

    // Получаем элемент из routeConfig для MAIN_PAGE
    const mainPageElement =
        routeConfig[Object.keys(routeConfig)[0] as keyof typeof routeConfig].element;

    return <>{mainPageElement}</>;
};

export const Router: React.FC = () => {
    useEffect(() => {
        const handleKeyDown = (event: any) => {
            if (event.ctrlKey && event.key === 'r') {
                event.preventDefault();
                window.location.reload();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        // Убираем обработчик при размонтировании компонента
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    return (
        <BrowserRouter basename="/messenger">
            <Routes>
                <Route path="/" element={<MessengerWrapper />} />

                <Route
                    path="*"
                    element={
                        <Result
                            status="404"
                            title="404"
                            subTitle="Извините, страницы на которую вы перешли не существует."
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};
