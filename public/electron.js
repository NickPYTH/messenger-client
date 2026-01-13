const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, desktopCapturer, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Важно объявить переменные глобально, чтобы сборщик мусора их не удалил
let tray = null;
let mainWindow = null;

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        // Если у вас frameless-окно, это не помешает работе
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            // 2. НОВОЕ: Разрешаем доступ к desktopCapturer из рендерера
            enableRemoteModule: true,
            webSecurity: false, // Для локальной разработки (можно отключить в продакшене)
            preload: preloadPath,
            allowRunningInsecureContent: true,
        },
    });

    //mainWindow.loadURL('http://localhost:3000/messenger/');
    mainWindow.loadURL('https://sco1-vapp-09.sgp.ru/messenger/');

    Menu.setApplicationMenu(null);

    // 3. НОВОЕ: Открываем DevTools для отладки
    mainWindow.webContents.openDevTools();

    // Перехватываем событие закрытия окна
    mainWindow.on('close', (event) => {
        // Если пользователь не выходит через Quit, просто прячем окно
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide(); // Скрываем окно
            return false;
        }
    });
}

function createTray() {
    // Создаем иконку для трея. Лучше использовать абсолютный путь
    const iconPath = path.join(__dirname, 'tray-icon.png'); // Укажите путь к вашей иконке

    let trayImage;
    console.log(__dirname);
    try {
        trayImage = nativeImage.createFromPath(iconPath);
    } catch (error) {
        // Если иконка не найдена, можно создать простую или использовать встроенную
        console.error('Tray icon not found, using default.');
        trayImage = nativeImage.createFromDataURL(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        ); // Простая заглушка
    }

    // Ресайзим иконку под нужный размер (обычно 16x16 или 32x32)
    trayImage = trayImage.resize({ width: 16, height: 16 });

    tray = new Tray(trayImage);
    tray.setToolTip('Корпоративный мессенджер'); // Текст при наведении

    // Создаем контекстное меню для иконки в трея
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Открыть',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Выйти',
            click: () => {
                app.isQuitting = true;
                app.quit(); // Настоящий выход из приложения
            },
        },
    ]);

    tray.setContextMenu(contextMenu);

    // Дополнительно: показ окна по клику на иконку (опционально)
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
            }
        }
    });
}

// 5. НОВОЕ: IPC обработчики для WebRTC
function setupIPCHandlers() {
    // 0. Обработчик для создания скриншота
    ipcMain.handle('take-screenshot', async (event) => {
        try {
            console.log('Создание скриншота...');

            // Получаем размеры экрана через screen модуль
            const { screen } = require('electron');
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height } = primaryDisplay.size;
            const scaleFactor = primaryDisplay.scaleFactor;

            // Получаем список источников экрана
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: {
                    width: width * scaleFactor,
                    height: height * scaleFactor,
                },
            });

            if (sources.length > 0) {
                // Берем первый экран (можно добавить выбор экрана если их несколько)
                const screenshot = sources[0].thumbnail;

                // Конвертируем в base64
                const base64Data = screenshot.toPNG().toString('base64');

                console.log('Скриншот создан успешно, размер:', width, 'x', height);
                return base64Data;
            } else {
                console.error('Не найдены источники экрана');
                return null;
            }
        } catch (error) {
            console.error('Ошибка при создании скриншота:', error);
            return null;
        }
    });

    // 1. Обработчик для отправки скриншота (как файл или base64)
    ipcMain.handle('upload-screenshot', async (event, { base64Data, fileName = `screenshot-${Date.now()}.png` }) => {
        try {
            // Здесь можно добавить логику отправки на ваш сервер
            // Например, конвертация в Blob и отправка через fetch
            const buffer = Buffer.from(base64Data, 'base64');

            // Возвращаем данные для отправки из React-компонента
            return {
                success: true,
                data: {
                    fileName,
                    base64Data, // Для отправки как base64
                    buffer: buffer.buffer, // Для отправки как ArrayBuffer
                    size: buffer.length,
                    mimeType: 'image/png',
                },
            };
        } catch (error) {
            console.error('Ошибка при обработке скриншота:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    // 2. Тестовый обработчик для проверки связи
    ipcMain.handle('test-connection', async (event) => {
        console.log('Получен тестовый запрос от React');
        return {
            status: 'success',
            message: 'Связь Electron-React работает!',
            timestamp: new Date().toISOString(),
        };
    });

    // 3. Обработчик для получения источников экрана
    ipcMain.handle('get-desktop-sources', async (event, options) => {
        try {
            console.log('Запрос источников экрана...');
            const sources = await desktopCapturer.getSources({
                types: ['screen', 'window'],
                thumbnailSize: { width: 150, height: 150 },
            });
            console.log(`Найдено ${sources.length} источников`);
            return sources;
        } catch (error) {
            console.error('Ошибка desktopCapturer:', error);
            return [];
        }
    });

    // 4. Обработчик для выбора источника
    ipcMain.handle('select-source', (event, sourceId) => {
        console.log('Выбран источник:', sourceId);
        if (mainWindow) {
            mainWindow.webContents.send('source-selected', sourceId);
        }
        return true;
    });

    // 5. Добавьте также обработку других событий если нужно
    ipcMain.on('log-message', (event, message) => {
        console.log('Сообщение от React:', message);
    });
}

app.commandLine.appendSwitch('auth-server-whitelist', '*.sgp.ru');
app.commandLine.appendSwitch('auth-negotiate-whitelist', '*.sgp.ru');

// Инициализация приложения
app.whenReady().then(() => {
    createWindow();
    createTray();
    setupIPCHandlers(); // 6. НОВОЕ: Инициализируем обработчики IPC

    // Для macOS: если нет открытых окон, создать новое по активации приложения
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Важно: предотвращаем выход из приложения при закрытии всех окон
app.on('window-all-closed', (event) => {
    if (process.platform !== 'darwin') {
        event.preventDefault();
    }
});
