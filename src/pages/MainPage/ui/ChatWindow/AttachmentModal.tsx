// components/FileUploadModal.jsx
import React, { useState, useEffect } from 'react';
import {
    Modal,
    Upload,
    Button,
    List,
    Progress,
    Image,
    message,
    Space,
    Typography,
    Tag
} from 'antd';
import {
    UploadOutlined,
    PaperClipOutlined,
    EyeOutlined,
    DeleteOutlined,
    CloseOutlined,
    CheckOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Dragger } = Upload;

export const AttachmentModal = ({ visible, onCancel, onFilesSelected, existingFiles }:any) => {
    const [fileList, setFileList] = useState<any[]>([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [uploading, setUploading] = useState(false);

    // Инициализируем с существующими файлами (если редактируем)
    useEffect(() => {
        // Если модалка открывается заново, сбрасываем fileList
        if (visible) {
            if (existingFiles && existingFiles.length > 0) {
                // Сравниваем только если массив изменился по содержанию
                const existingFilesString = JSON.stringify(existingFiles.map((f:any ) => f.uid).sort());
                const currentFileListString = JSON.stringify(fileList.map(f => f.uid).sort());

                if (existingFilesString !== currentFileListString) {
                    setFileList(
                        existingFiles.map((file: any, index:any) => ({
                            ...file,
                            uid: file.uid || `existing-${index}`,
                            status: 'done'
                        }))
                    );
                }
            } else {
                setFileList([]);
            }
        }
    }, [visible, existingFiles]);

    // Поддерживаемые форматы
    const supportedFormats = {
        'image/*': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'application/pdf': ['pdf'],
        'application/msword': ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
        'text/plain': ['txt'],
        'text/csv': ['csv'],
        'application/zip': ['zip'],
        'audio/*': ['mp3', 'wav'],
        'video/*': ['mp4', 'avi', 'mov']
    };

    const maxFileSize = 100 * 1024 * 1024; // 100MB
    const maxTotalSize = 200 * 1024 * 1024; // 200MB
    const maxFiles = 10;

    // Получить расширение файла
    const getFileExtension = (filename:string) => {
        return filename.split('.').pop()?.toLowerCase() ?? "";
    };

    // Получить тип файла по расширению
    const getMimeType = (filename:string) => {
        const ext = getFileExtension(filename);
        for (const [mime, exts] of Object.entries(supportedFormats)) {
            if (exts.includes(ext)) {
                return mime;
            }
        }
        return 'application/octet-stream';
    };

    // Получить иконку для типа файла
    const getFileIcon = (fileType:string, filename:string) => {
        if (fileType.includes('image/')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('sheet')) return '📊';
        if (fileType.includes('text/') || fileType.includes('csv')) return '📃';
        if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
        if (fileType.includes('audio/')) return '🎵';
        if (fileType.includes('video/')) return '🎬';
        return '📎';
    };

    // Форматирование размера файла
    const formatFileSize = (bytes:any) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Валидация файла перед добавлением
    const validateFile = (file:any) => {
        const ext = getFileExtension(file.name);
        let isValidType = false;

        // Проверка типа файла
        for (const exts of Object.values(supportedFormats)) {
            if (exts.includes(ext)) {
                isValidType = true;
                break;
            }
        }

        if (!isValidType) {
            message.error(`Формат .${ext} не поддерживается`);
            return false;
        }

        // Проверка размера
        if (file.size > maxFileSize) {
            message.error(`Файл ${file.name} превышает максимальный размер ${maxFileSize / (1024*1024)}MB`);
            return false;
        }

        // Проверка общего размера
        const totalSize = [...fileList, file].reduce((sum, f) => sum + f.size, 0);
        if (totalSize > maxTotalSize) {
            message.error(`Общий размер файлов превышает ${maxTotalSize / (1024*1024)}MB`);
            return false;
        }

        // Проверка количества файлов
        if (fileList.length >= maxFiles) {
            message.error(`Максимальное количество файлов: ${maxFiles}`);
            return false;
        }

        return true;
    };

    // Обработчик добавления файлов
    const handleBeforeUpload = (file:any) => {
        if (!validateFile(file)) {
            return Upload.LIST_IGNORE;
        }

        const newFile = {
            uid: file.uid,
            name: file.name,
            size: file.size,
            type: getMimeType(file.name),
            originFileObj: file,
            status: 'waiting',
            percent: 0
        };

        setFileList(prev => [...prev, newFile]);
        return false; // Отменяем автоматическую загрузку
    };

    // Удаление файла
    const handleRemove = (file:any) => {
        setFileList(prev => prev.filter(f => f.uid !== file.uid));
    };

    // Предпросмотр файла
    const handlePreview = (file:any) => {
        if (file.type.includes('image/')) {
            const reader = new FileReader();
            reader.onload = (e:any) => {
                setPreviewImage(e.target.result);
                setPreviewVisible(true);
            };
            reader.readAsDataURL(file.originFileObj);
        } else if (file.type.includes('pdf')) {
            const url = URL.createObjectURL(file.originFileObj);
            window.open(url, '_blank');
        } else {
            message.info('Предпросмотр недоступен для этого типа файла');
        }
    };

    // Подготовка файлов для отправки
    const prepareFilesForUpload = () => {
        return fileList.map(file => ({
            uid: file.uid,
            name: file.name,
            size: file.size,
            type: file.type,
            originFileObj: file.originFileObj || file,
            status: 'ready'
        }));
    };

    // Сохранение выбранных файлов
    const handleOk = () => {
        if (fileList.length === 0) {
            message.warning('Добавьте хотя бы один файл');
            return;
        }

        const preparedFiles = prepareFilesForUpload();
        onFilesSelected(preparedFiles);
        onCancel();
    };

    // Сброс формы
    const handleCancel = () => {
        setFileList([]);
        onCancel();
    };

    return (
        <>
            <Modal
                title="Прикрепить файлы"
                open={visible}
                onOk={handleOk}
                onCancel={handleCancel}
                width={700}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        Отмена
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleOk}
                        loading={uploading}
                        icon={<CheckOutlined />}
                    >
                        Прикрепить ({fileList.length})
                    </Button>
                ]}
            >
                <div style={{ marginBottom: 16 }}>
                    <Dragger
                        multiple
                        beforeUpload={handleBeforeUpload}
                        showUploadList={false}
                        disabled={fileList.length >= maxFiles}
                    >
                        <p className="ant-upload-drag-icon">
                            <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Нажмите или перетащите файлы для загрузки
                        </p>
                        <p className="ant-upload-hint">
                            Максимум {maxFiles} файлов, каждый до {maxFileSize / (1024*1024)}MB
                        </p>
                    </Dragger>
                </div>

                {/* Информация о лимитах */}
                <Space style={{ marginBottom: 16 }} wrap>
                    <Tag color="blue">
                        Файлов: {fileList.length}/{maxFiles}
                    </Tag>
                    <Tag color="green">
                        Общий размер: {formatFileSize(fileList.reduce((sum, f) => sum + f.size, 0))}
                    </Tag>
                </Space>

                {/* Список файлов */}
                {fileList.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <List
                            size="small"
                            dataSource={fileList}
                            renderItem={(file) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EyeOutlined />}
                                            onClick={() => handlePreview(file)}
                                            title="Предпросмотр"
                                        />,
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemove(file)}
                                            title="Удалить"
                                        />
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <span style={{ fontSize: '20px' }}>
                        {getFileIcon(file.type, file.name)}
                      </span>
                                        }
                                        title={
                                            <Text ellipsis style={{ maxWidth: 300 }}>
                                                {file.name}
                                            </Text>
                                        }
                                        description={
                                            <Space size="small">
                                                <Text type="secondary">{formatFileSize(file.size)}</Text>
                                                <Tag color="default">
                                                    {getFileExtension(file.name).toUpperCase()}
                                                </Tag>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                )}

                {/* Модалка для предпросмотра изображений */}
                <Modal
                    open={previewVisible}
                    footer={null}
                    onCancel={() => setPreviewVisible(false)}
                    width={800}
                >
                    <Image
                        src={previewImage}
                        alt="Предпросмотр"
                        style={{ width: '100%' }}
                    />
                </Modal>
            </Modal>
        </>
    );
};
