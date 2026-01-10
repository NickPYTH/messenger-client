import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import { Result } from 'antd';
import { routeConfig } from './routeConfig';

export const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {Object.values(routeConfig).map(({ element, path }) => (
                    <Route key={path} path={path} element={element} />
                ))}
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
