import {Avatar, Flex, Modal} from "antd";
import React, { useEffect } from "react";
import {setSelectedConversation} from "../../../../../store/slice/GeneralSlice";
import {conversationsAPI} from "../../../../../service/ConversationsService";
import {useDispatch, useSelector} from "react-redux";
import {RootStateType} from "../../../../../store/store";

type PropsType = {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}

export const ConfirmChatDeleteModal = (props:PropsType) => {

    // Store
    const dispatch = useDispatch();
    const selectedConversation = useSelector((state: RootStateType) => state.currentUser.selectedConversation);
    // -----

    // Web requests
    const [deleteConversation, {
        isSuccess: isDeleteConversationSuccess,
    }] = conversationsAPI.useDeleteMutation();
    // -----

    // Effects
    useEffect(() => {
        if (isDeleteConversationSuccess)
            dispatch(setSelectedConversation(null));
    }, [isDeleteConversationSuccess]);
    // -----

    // Handlers
    const deleteConversationHandler = () => {
        if (selectedConversation)
            deleteConversation(selectedConversation.id);
    };
    // -----

    return (
        <Modal title={`Вы точно хотите удалить чат?`}
               open={props.visible}
               onCancel={() => props.setVisible(false)}
               okText={"Да"}
               cancelText={"Нет"}
               width={300}
               onOk={deleteConversationHandler}
        >

        </Modal>
    )
}
