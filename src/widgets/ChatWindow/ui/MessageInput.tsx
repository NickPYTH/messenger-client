import React from 'react';
import { Badge, Button, Flex, Popover } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import {
    DeleteOutlined,
    DesktopOutlined,
    PaperClipOutlined,
    SendOutlined,
} from '@ant-design/icons';

interface MessageInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSend: () => void;
    onAttach: () => void;
    onScreenshot: () => void;
    onDropContext?: () => void;
    isLoading: boolean;
    attachmentsCount: number;
    isVirtualHelper: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    value,
    onChange,
    onSend,
    onAttach,
    onScreenshot,
    onDropContext,
    isLoading,
    attachmentsCount,
    isVirtualHelper,
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const isSendDisabled = (!value || value.trim() === '') && attachmentsCount === 0;

    return (
        <Flex justify="center" align="center" gap="small" style={{ marginBottom: 15 }}>
            {isVirtualHelper && onDropContext && (
                <Popover content="Сбросить контекст">
                    <Button
                        style={{ width: 39 }}
                        onClick={onDropContext}
                        disabled={isLoading}
                        icon={<DeleteOutlined />}
                    />
                </Popover>
            )}

            {!isVirtualHelper && (
                <Badge count={attachmentsCount}>
                    <Popover content="Добавить файлы">
                        <Button
                            onClick={onAttach}
                            disabled={isLoading}
                            icon={<PaperClipOutlined />}
                        />
                    </Popover>
                </Badge>
            )}

            {!isVirtualHelper && (
                <Popover content="Отправить снимок экрана">
                    <Button
                        style={{ width: 39 }}
                        onClick={onScreenshot}
                        disabled={isLoading}
                        icon={<DesktopOutlined />}
                    />
                </Popover>
            )}

            <TextArea
                value={value}
                onChange={onChange}
                onPressEnter={handleKeyPress}
                style={{ maxWidth: 600, width: '100%' }}
                placeholder="Введите сообщение..."
                allowClear
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={isLoading}
            />

            <Button
                type="primary"
                onClick={onSend}
                loading={isLoading}
                disabled={isSendDisabled}
                icon={<SendOutlined />}
            />
        </Flex>
    );
};
