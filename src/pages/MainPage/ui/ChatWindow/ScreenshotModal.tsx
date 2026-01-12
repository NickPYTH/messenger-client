import React, { useState } from 'react';
import { Modal, Button, Flex, Spin, message } from 'antd';
import { DesktopOutlined, SendOutlined, RetweetOutlined } from '@ant-design/icons';

interface ScreenshotModalProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    onSendScreenshot: (screenshotData: string, fileName: string) => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
    visible,
    setVisible,
    onSendScreenshot,
}) => {
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const takeScreenshot = async () => {
        setLoading(true);

        // Используем window.electronAPI если настроен preload
        // или напрямую ipcRenderer если nodeIntegration: true
        const screenshotData =
            (await (window as any).electronAPI?.takeScreenshot?.()) ||
            (await (window as any).ipcRenderer?.invoke?.('take-screenshot'));

        if (screenshotData) {
            setScreenshot(`data:image/png;base64,${screenshotData}`);
            message.success('Скриншот создан');
        } else {
            message.error('Не удалось создать скриншот');
        }

        setLoading(false);
    };

    const sendScreenshot = async () => {
        if (!screenshot) return;

        try {
            const base64Data = screenshot.replace('data:image/png;base64,', '');
            const fileName = `screenshot-${Date.now()}.png`;

            // Вызываем callback для отправки
            onSendScreenshot(base64Data, fileName);

            message.success('Скриншот готов к отправке');
            handleClose();
        } catch (error) {
            console.error('Ошибка при отправке скриншота:', error);
            message.error('Ошибка при отправке скриншота');
        }
    };

    const handleClose = () => {
        setScreenshot(null);
        setVisible(false);
    };

    return (
        <Modal
            title={
                <Flex justify="space-between" align="center">
                    <span>Создание скриншота</span>
                </Flex>
            }
            open={visible}
            onCancel={handleClose}
            closable={false}
            width={800}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Отмена
                </Button>,
                <Button
                    key="retake"
                    icon={<RetweetOutlined />}
                    onClick={takeScreenshot}
                    disabled={loading}
                >
                    Переснять
                </Button>,
                <Button
                    key="send"
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendScreenshot}
                    disabled={!screenshot}
                >
                    Отправить
                </Button>,
            ]}
        >
            <Flex vertical gap="middle" align="center">
                {!screenshot ? (
                    <Flex vertical align="center" gap="middle" style={{ padding: '40px 0' }}>
                        <DesktopOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
                        <Button
                            type="primary"
                            size="large"
                            onClick={takeScreenshot}
                            loading={loading}
                        >
                            Сделать скриншот
                        </Button>
                    </Flex>
                ) : (
                    <Flex vertical gap="middle" style={{ width: '100%' }}>
                        <div
                            style={{
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#666',
                                marginBottom: '10px',
                            }}
                        >
                            Предпросмотр скриншота
                        </div>
                        <div
                            style={{
                                maxHeight: '400px',
                                overflow: 'auto',
                                border: '1px solid #d9d9d9',
                                borderRadius: '8px',
                                padding: '8px',
                                background: '#fafafa',
                            }}
                        >
                            <img
                                src={screenshot}
                                alt="Скриншот"
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    margin: '0 auto',
                                }}
                            />
                        </div>
                    </Flex>
                )}

                {loading && (
                    <Flex justify="center" align="center" style={{ height: '200px' }}>
                        <Spin size="large" />
                    </Flex>
                )}
            </Flex>
        </Modal>
    );
};
