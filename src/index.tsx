import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {ReduxProvider} from './app/ReduxProvider'
import { Router } from './component/Router';
import { WebSocketProvider } from './app/WebSocketProvider';
import {wsHost} from "./shared/config/constants";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ReduxProvider>
        <WebSocketProvider
            url={`${wsHost}/messenger/ws/messages/`}
            onConnectionChange={(connected) => {
                console.log(connected ? 'Соединение установлено' : 'Соединение потеряно');
            }}
        >
      <Router />
        </WebSocketProvider>
    </ReduxProvider>
  </React.StrictMode>
);
