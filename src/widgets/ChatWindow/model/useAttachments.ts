import { useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';

const useAttachments = () => {
    const [attachments, setAttachments] = useState<UploadFile[]>([]);
    const [visibleModal, setVisibleModal] = useState(false);

    const addAttachments = (files: UploadFile[]) => {
        setAttachments((prev) => [...prev, ...files]);
    };

    const removeAttachment = (uid: string) => {
        setAttachments((prev) => prev.filter((file) => file.uid !== uid));
    };

    const clearAttachments = () => {
        setAttachments([]);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const previewAttachment = (file: UploadFile) => {
        if (file.originFileObj) {
            const url = URL.createObjectURL(file.originFileObj);
            window.open(url, '_blank');
            URL.revokeObjectURL(url); // освобождаем память
        }
    };

    return {
        attachments,
        visibleModal,
        setVisibleModal,
        addAttachments,
        removeAttachment,
        clearAttachments,
        formatFileSize,
        previewAttachment,
    };
};

export default useAttachments;
