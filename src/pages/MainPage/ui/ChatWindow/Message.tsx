import { MessageModel } from "../../../../entities/MessageModel";
import { AttachmentModel } from "../../../../entities/AttachmentModel";
import { host } from "../../../../shared/config/constants";
import { isLikelyCode } from "../../../../shared/config/utils.py";
import {
    Flex,
    Upload,
    Dropdown,
    MenuProps,
    message as antdMessage,
    Modal,
    Button,
    Space,
    Typography
} from "antd";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import React, { JSX, useState, useRef } from "react";
import {
    CopyOutlined,
    EditOutlined,
    DeleteOutlined,
    ShareAltOutlined,
    CodeOutlined,
    DownloadOutlined,
    MoreOutlined
} from '@ant-design/icons';
import {conversationsAPI} from "../../../../service/ConversationsService";
import {messageAPI} from "../../../../service/MessageService";

const { Text } = Typography;

type PropsType = {
    data: MessageModel;
    fromYou: boolean;
    onEdit?: (message: MessageModel) => void;
    onDelete?: (messageId: string) => void;
    onCopy?: (text: string) => void;
    onReply?: (message: MessageModel) => void;
}

export const Message = (props: PropsType) => {

    // States
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [copyModalVisible, setCopyModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const messageRef = useRef<HTMLDivElement>(null);
    // -----

    // Web requests
    const [deleteMessage, {
        isSuccess: isSuccessDeleteMessage,
    }] = messageAPI.useDeleteMutation();
    // -----

    // Handlers
    // Функция для автоматического определения языка кода
    const detectLanguage = (codeText: string): string => {
        const text = codeText.trim();

        if (/<\?php|namespace\s|use\s[A-Z]/.test(text)) return 'php';
        if (/import\sReact|export\sdefault|\.tsx?$/.test(text)) return 'typescript';
        if (/import\s|from\s|\.jsx?$|const\s|let\s|var\s/.test(text)) return 'javascript';
        if (/def\s|class\s.*:|import\s|\.py$|print\(/.test(text)) return 'python';
        if (/package\s|public\sclass|System\.|\.java$|void\s/.test(text)) return 'java';
        if (/func\s|package\s|import\s"|\.go$|fmt\./.test(text)) return 'go';
        if (/<\?|<html|<!DOCTYPE|div\s|class=|\.html?$/.test(text)) return 'html';
        if (/{|}\s*;|@media|\.css$|color:|margin:/.test(text)) return 'css';
        if (/CREATE\s|SELECT\s|INSERT\s|UPDATE\s|FROM\s/i.test(text)) return 'sql';
        if (/^{.*}$|^\[.*\]$/.test(text) && text.includes('":')) return 'json';
        if (/#include|int\smain|printf|\.cpp$|\.c$/.test(text)) return 'cpp';
        if (/fn\s|impl\s|let\smut|\.rs$/.test(text)) return 'rust';

        return 'text';
    };
    // Обработка правого клика
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenuVisible(true);
    };
    // Функции для пунктов меню
    const handleCopyText = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(props.data.text)
                .then(() => {
                    antdMessage.success('Текст скопирован');
                    props.onCopy?.(props.data.text);
                })
                .catch(() => {
                    setCopyModalVisible(true);
                });
        } else {
            setCopyModalVisible(true);
        }
        setContextMenuVisible(false);
    };
    const handleCopyCode = () => {
        const codeBlocks = props.data.text.match(/```[\s\S]*?```/g);
        if (codeBlocks && codeBlocks.length > 0) {
            const allCode = codeBlocks
                .map(block => block.replace(/```\w*\n?/, '').replace(/```$/, '').trim())
                .join('\n\n');

            if (navigator.clipboard) {
                navigator.clipboard.writeText(allCode)
                    .then(() => {
                        antdMessage.success('Код скопирован');
                        props.onCopy?.(allCode);
                    })
                    .catch(() => {
                        Modal.info({
                            title: 'Скопируйте код',
                            content: (
                                <div style={{ marginTop: 16 }}>
                                    <SyntaxHighlighter language={detectLanguage(allCode)} style={docco}>
                                        {allCode}
                                    </SyntaxHighlighter>
                                </div>
                            ),
                            width: 600,
                        });
                    });
            }
        }
        setContextMenuVisible(false);
    };
    const handleEdit = () => {
        props.onEdit?.(props.data);
        setContextMenuVisible(false);
    };
    const handleDelete = () => {
        setDeleteModalVisible(true);
        setContextMenuVisible(false);
    };
    const confirmDelete = () => {
        if (props.data.id) {
            deleteMessage(props.data.id)
            setDeleteModalVisible(false);
            antdMessage.success('Сообщение удалено');
        }
    };
    const handleReply = () => {
        props.onReply?.(props.data);
        setContextMenuVisible(false);
    };
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Сообщение из чата',
                text: props.data.text.length > 100
                    ? `${props.data.text.substring(0, 100)}...`
                    : props.data.text,
                url: window.location.href,
            });
        } else {
            const shareText = `Сообщение: ${props.data.text}\n\nВремя: ${props.data.sent_at}`;
            navigator.clipboard.writeText(shareText)
                .then(() => antdMessage.success('Ссылка на сообщение скопирована'));
        }
        setContextMenuVisible(false);
    };
    const handleDownloadAttachments = () => {
        if (props.data.attachments && props.data.attachments.length > 0) {
            props.data.attachments.forEach(attachment => {
                const link = document.createElement('a');
                link.href = attachment.file_url;
                link.download = attachment.file_name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            antdMessage.success(`Скачано файлов: ${props.data.attachments.length}`);
        }
        setContextMenuVisible(false);
    };
    // Определение пунктов контекстного меню
    const getMenuItems = (): MenuProps['items'] => {
        const items: MenuProps['items'] = [
            {
                key: 'copy-text',
                icon: <CopyOutlined />,
                label: 'Копировать текст',
                onClick: handleCopyText,
            },
            {
                key: 'reply',
                icon: <ShareAltOutlined rotate={180} />,
                label: 'Ответить',
                onClick: handleReply,
            },
        ];

        // Добавляем пункт для копирования кода, если есть код
        if (props.data.text.includes('```') || isLikelyCode(props.data.text)) {
            items.splice(1, 0, {
                key: 'copy-code',
                icon: <CodeOutlined />,
                label: 'Копировать код',
                onClick: handleCopyCode,
            });
        }

        // Добавляем пункт для скачивания вложений, если они есть
        if (props.data.attachments && props.data.attachments.length > 0) {
            items.push({
                key: 'download',
                icon: <DownloadOutlined />,
                label: `Скачать файлы (${props.data.attachments.length})`,
                onClick: handleDownloadAttachments,
            });
        }

        // Добавляем пункт для шаринга
        items.push({
            key: 'share',
            icon: <ShareAltOutlined />,
            label: 'Поделиться',
            onClick: handleShare,
        });

        // Если сообщение от текущего пользователя, добавляем редактирование и удаление
        if (props.fromYou) {
            items.push(
                { type: 'divider' },
                {
                    key: 'edit',
                    icon: <EditOutlined />,
                    label: 'Редактировать',
                    onClick: handleEdit,
                },
                {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: 'Удалить',
                    danger: true,
                    onClick: handleDelete,
                }
            );
        }

        return items;
    };
    // Основная функция форматирования текста сообщения (остается без изменений)
    const formatMessageText = (text: string) => {
        // ... (ваш существующий код форматирования) ...
        // Оставляем ваш код форматирования без изменений
        if (isLikelyCode(text)) {
            const language = detectLanguage(text);
            return (
                <SyntaxHighlighter
                    language={language}
                    style={docco}
                    showLineNumbers={true}
                    customStyle={{
                        fontSize: '12px',
                        padding: '12px',
                        borderRadius: '6px',
                        margin: '8px 0',
                        backgroundColor: '#f5f5f5',
                        maxWidth: '100%',
                        overflowX: 'auto'
                    }}
                >
                    {text.trim()}
                </SyntaxHighlighter>
            );
        }

        // ... остальной код форматирования ...

        return <span>{text}</span>;
    };
    // -----

    return (
        <>
            <Dropdown
                menu={{ items: getMenuItems() }}
                trigger={['contextMenu']}
                open={contextMenuVisible}
                onOpenChange={setContextMenuVisible}
            >
                <div
                    ref={messageRef}
                    className="message"
                    style={{
                        display: 'flex',
                        alignSelf: props.fromYou ? 'end' : 'start',
                        maxWidth: 600,
                        margin: '0 10px 12px 0',
                        cursor: 'context-menu',
                        position: 'relative',
                    }}
                    onContextMenu={handleContextMenu}
                >
                    <Flex vertical gap={'small'}>
                        {/* Кнопка меню (опционально, для мобильных устройств) */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: props.fromYou ? 'auto' : -30,
                            left: props.fromYou ? -30 : 'auto',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                        }}>
                            <Button
                                type="text"
                                icon={<MoreOutlined />}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setContextMenuVisible(true);
                                }}
                            />
                        </div>

                        {/* Контейнер для текста сообщения */}
                        <div
                            style={{
                                padding: '8px 8px',
                                borderRadius: '10px',
                                maxWidth: 550,
                                wordBreak: 'break-word',
                            }}
                        >
                            {formatMessageText(props.data.text)}
                        </div>

                        {/* Время отправки */}
                        <Flex style={{
                            fontSize: 10,
                            color: '#888',
                            paddingLeft: '4px',
                            justifyContent: props.fromYou ? 'flex-end' : 'flex-start'
                        }}>
                            {props.data.sent_at}
                        </Flex>

                        {/* Вложения */}
                        {props.data.attachments && props.data.attachments.length > 0 && (
                            <Upload
                                defaultFileList={props.data.attachments.map((file: AttachmentModel) => ({
                                    uid: file.id.toString(),
                                    name: file.file_name.length > 37 ?
                                        `${file.file_name.slice(0, 34)}...` :
                                        file.file_name,
                                    status: 'done',
                                    url: `${file.file_url}`,
                                }))}
                                showUploadList={{
                                    showRemoveIcon: false,
                                    showDownloadIcon: true,
                                    showPreviewIcon: true,
                                }}
                            />
                        )}
                    </Flex>
                </div>
            </Dropdown>

            {/* Модальное окно для копирования текста */}
            <Modal
                title="Скопируйте текст"
                open={copyModalVisible}
                onCancel={() => setCopyModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setCopyModalVisible(false)}>
                        Закрыть
                    </Button>,
                ]}
            >
                <div style={{ marginTop: 16 }}>
                    <Text copyable={{ text: props.data.text }}>
                        {props.data.text.length > 500
                            ? `${props.data.text.substring(0, 500)}...`
                            : props.data.text}
                    </Text>
                </div>
            </Modal>

            {/* Модальное окно подтверждения удаления */}
            <Modal
                title="Подтверждение удаления"
                open={deleteModalVisible}
                onOk={confirmDelete}
                onCancel={() => setDeleteModalVisible(false)}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
            >
                <p>Вы уверены, что хотите удалить это сообщение?</p>
                <div style={{
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginTop: '8px'
                }}>
                    {props.data.text.length > 100
                        ? `${props.data.text.substring(0, 100)}...`
                        : props.data.text}
                </div>
            </Modal>
        </>
    );
};