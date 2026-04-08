export interface ScreenshotModalProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    onSendScreenshot: (screenshotData: string, fileName: string) => void;
}
