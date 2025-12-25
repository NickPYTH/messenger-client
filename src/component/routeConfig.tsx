import {RouteProps} from "react-router-dom";
import React from "react";
import { MainPage } from "../pages/MainPage";
import ScreenShare from "../App";
import Receiver from "../Receiver";

export enum AppRoutes {
    MAIN_PAGE = "MAIN_PAGE",
    SENDER_PAGE = "SENDER_PAGE",
    RECEIVER_PAGE = "RECEIVER_PAGE",
}

export const RoutePath: Record<AppRoutes, string> = {
    [AppRoutes.MAIN_PAGE]: '/messenger/',
    [AppRoutes.SENDER_PAGE]: '/sender/',
    [AppRoutes.RECEIVER_PAGE]: '/receiver/',
}

export const routeConfig: Record<AppRoutes, RouteProps> = {
    [AppRoutes.MAIN_PAGE]: {
        path: RoutePath.MAIN_PAGE,
        element: <MainPage/>
    },
    [AppRoutes.SENDER_PAGE]: {
        path: RoutePath.SENDER_PAGE,
        element: <ScreenShare/>
    },
    [AppRoutes.RECEIVER_PAGE]: {
        path: RoutePath.RECEIVER_PAGE,
        element: <Receiver/>
    },
}
