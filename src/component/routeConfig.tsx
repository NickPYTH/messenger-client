import { RouteProps } from 'react-router-dom';
import React from 'react';
import { MainPage } from '../pages/MainPage';
import Receiver from '../Receiver';

export enum AppRoutes {
    MAIN_PAGE = 'MAIN_PAGE',
    RECEIVER_PAGE = 'RECEIVER_PAGE',
}

export const RoutePath: Record<AppRoutes, string> = {
    [AppRoutes.MAIN_PAGE]: '/messenger/',
    [AppRoutes.RECEIVER_PAGE]: '/messenger/receiver/',
};

export const routeConfig: Record<AppRoutes, RouteProps> = {
    [AppRoutes.MAIN_PAGE]: {
        path: RoutePath.MAIN_PAGE,
        element: <MainPage />,
    },
    [AppRoutes.RECEIVER_PAGE]: {
        path: RoutePath.RECEIVER_PAGE,
        element: <Receiver />,
    },
};
