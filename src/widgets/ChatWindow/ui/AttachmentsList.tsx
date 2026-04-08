import React from 'react';
import { Button, Flex } from 'antd';
import { DeleteOutlined, EyeOutlined, PaperClipOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface AttachmentsListProps {
    attachments: UploadFile[];
    onRemove: (uid: string) => void;
    onPreview: (file: UploadFile) => void;
    formatFileSize: (bytes: number) => string;
}

export const AttachmentsList: React.FC<AttachmentsListProps> = ({
    attachments,
    onRemove,
    onPreview,
    formatFileSize,
}) => {
    if (attachments.length === 0) return null;

    return (
        <Flex
            vertical
            gap="small"
            style={{
                padding: '8px',
                background: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
            }}
        >
            <div style={{ fontSize: '12px', color: '#666' }}>
                Прикрепленные файлы ({attachments.length}):
            </div>

            <Flex vertical gap="4px">
                {attachments.map((file) => (
                    <Flex
                        key={file.uid}
                        justify="space-between"
                        align="center"
                        style={{
                            padding: '4px 8px',
                            background: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #e8e8e8',
                        }}
                    >
                        <Flex align="center" gap="small">
                            <PaperClipOutlined style={{ color: '#1890ff' }} />
                            <span
                                style={{
                                    fontSize: '12px',
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {file.name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#999' }}>
                                {file.size && formatFileSize(file.size)}
                            </span>
                        </Flex>

                        <Flex gap="4px">
                            <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => onPreview(file)}
                                title="Предпросмотр"
                            />
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onRemove(file.uid)}
                                title="Удалить"
                            />
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
};
