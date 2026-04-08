import { Modal } from 'antd';
import { setSelectedConversation } from '../../../../../app/store/slice/GeneralSlice';
import { RootStateType } from '../../../../../app/store/store';
import { conversationsAPI } from '../../../../../entities/conversation';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PropsType } from '../model/types';

const ConfirmChatDeleteModal = (props: PropsType) => {
    // Store
    const dispatch = useDispatch();
    const selectedConversation = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );
    // -----

    // Web requests
    const [deleteConversation, { isSuccess: isDeleteConversationSuccess }] =
        conversationsAPI.useDeleteMutation();
    // -----

    // Effects
    useEffect(() => {
        if (isDeleteConversationSuccess) dispatch(setSelectedConversation(null));
    }, [isDeleteConversationSuccess]);
    // -----

    // Handlers
    const deleteConversationHandler = () => {
        if (selectedConversation) deleteConversation(selectedConversation.id);
    };
    // -----

    return (
        <Modal
            title={`Вы точно хотите удалить чат?`}
            open={props.visible}
            closable={false}
            onCancel={() => props.setVisible(false)}
            okText={'Да'}
            cancelText={'Нет'}
            width={300}
            onOk={deleteConversationHandler}
        ></Modal>
    );
};

export default ConfirmChatDeleteModal;
