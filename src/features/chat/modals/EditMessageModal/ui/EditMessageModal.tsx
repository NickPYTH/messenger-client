import { Modal } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { messageApi } from '../../../../../entities/message';
import { useEffect, useState } from 'react';
import { PropsType } from '../model/types';

const EditMessageModal = (props: PropsType) => {
    // States
    const [text, setText] = useState<string>(props.data.text);
    // -----

    // Web requests
    const [updateMessage, { isSuccess: isSuccessUpdateMessage }] = messageApi.useUpdateMutation();
    // -----

    // Effects
    useEffect(() => {
        if (isSuccessUpdateMessage) props.setVisible(false);
    }, [isSuccessUpdateMessage]);
    // -----

    // Handlers
    const confirmEdit = () => {
        if (props.data.id) {
            updateMessage({ ...props.data, text });
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
    );
};

export default EditMessageModal;
