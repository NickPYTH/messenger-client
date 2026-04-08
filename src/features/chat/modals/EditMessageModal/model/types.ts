import { MessageModel } from 'entities/message';

export type PropsType = {
    data: MessageModel;
    setVisible: (visible: boolean) => void;
    visible: boolean;
};
