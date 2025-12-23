import {RouteProps} from "react-router-dom";
import React from "react";
import { MainPage } from "../pages/MainPage";

export enum AppRoutes {
    MAIN_PAGE = "MAIN_PAGE"
}

export const RoutePath: Record<AppRoutes, string> = {
    [AppRoutes.MAIN_PAGE]: '/messenger/',
}

export const routeConfig: Record<AppRoutes, RouteProps> = {
    [AppRoutes.MAIN_PAGE]: {
        path: RoutePath.MAIN_PAGE,
        element: <MainPage/>
    },
}