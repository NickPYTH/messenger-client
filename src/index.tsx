import React from 'react';
import ReactDOM from 'react-dom/client';
import './app/styles/index.css';
import { ReduxProvider } from './app/providers/ReduxProvider';
import { Router } from './app/routes/Router';
import { WebSocketProvider } from './app/providers/WebSocketProvider';
import { wsHost } from './shared/config/constants';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <>
        <React.StrictMode>
            <ReduxProvider>
                <WebSocketProvider
                    url={`${wsHost}/ws/messages/`}
                    onConnectionChange={(connected) => {
                        console.log(connected ? 'Соединение установлено' : 'Соединение потеряно');
                    }}
                >
                    <Router />
                </WebSocketProvider>
            </ReduxProvider>
        </React.StrictMode>
    </>
);
