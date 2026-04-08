import { useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';

const useScreenshot = () => {
    const [visible, setVisible] = useState(false);

    const handleSendScreenshot = async (
        base64Data: string,
        fileName: string
    ): Promise<UploadFile> => {
        // Конвертируем base64 в файл
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], fileName, { type: 'image/png' });

        return {
            uid: `screenshot-${Date.now()}`,
            name: fileName,
            status: 'done',
            originFileObj: file,
            size: byteArray.length,
            type: 'image/png',
        } as UploadFile;
    };

    return {
        visible,
        setVisible,
        handleSendScreenshot,
    };
};

export default useScreenshot;
