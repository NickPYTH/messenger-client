import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {ReduxProvider} from './app/ReduxProvider'
import { Router } from './component/Router';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ReduxProvider>
      <Router />
    </ReduxProvider>
  </React.StrictMode>
);
