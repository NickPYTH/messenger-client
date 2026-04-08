import { Modal } from 'antd';
import { messageApi } from '../../../../../entities/message';
import { PropsType } from '../model/types';

const DeleteMessageModal = (props: PropsType) => {
    // States

    // -----

    // Web requests
    const [deleteMessage] = messageApi.useDeleteMutation();
    // -----

    // Handlers
    const confirmDelete = () => {
        if (props.data.id) {
            deleteMessage(props.data.id);
            props.setVisible(false);
        }
    };

    // -----

    return (
        <Modal
            title="Подтверждение удаления"
            open={props.visible}
            onOk={confirmDelete}
            onCancel={() => props.setVisible(false)}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
        >
            <p>Вы уверены, что хотите удалить это сообщение?</p>
            <div
                style={{
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginTop: '8px',
                }}
            >
                {props.data.text.length > 100
                    ? `${props.data.text.substring(0, 100)}...`
                    : props.data.text}
            </div>
        </Modal>
    );
};

export default DeleteMessageModal;
