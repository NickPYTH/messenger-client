import {message as antdMessage, Modal} from "antd";
import {messageAPI} from "../../../../service/MessageService";
import {MessageModel} from "../../../../entities/MessageModel";
import TextArea from "antd/es/input/TextArea";
import {useEffect, useState} from "react";

type PropsType = {
    data: MessageModel;
    setVisible: Function;
    visible: boolean;
}

export const EditMessageModal = (props: PropsType) => {

    // States
    const [text, setText] = useState<string>(props.data.text);
    // -----

    // Web requests
    const [updateMessage, {
        isSuccess: isSuccessUpdateMessage,
    }] = messageAPI.useUpdateMutation();
    // -----

    // Effects
    useEffect(() => {
        if (isSuccessUpdateMessage)
            props.setVisible(false);
    }, [isSuccessUpdateMessage]);
    // -----

    // Handlers
    const confirmEdit = () => {
        if (props.data.id) {
            updateMessage({...props.data, text})
            props.setVisible(false);
        }
    };
    // -----

    return (
        <Modal
            title="Редактирование сообщения"
            open={props.visible}
            onOk={confirmEdit}
            onCancel={() => props.setVisible(false)}
            okText="Сохранить"
            cancelText="Отмена"
        >
            <TextArea value={text} onChange={(e) => setText(e.target.value)} />
        </Modal>
    )
}
