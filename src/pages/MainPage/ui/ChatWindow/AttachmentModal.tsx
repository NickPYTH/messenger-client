import React from 'react';
import {Modal} from 'antd';
import {RootStateType} from "../../../../store/store";
import {useSelector} from "react-redux";

type ModalProps = {
    visible: boolean;
    setVisible: Function;
}

export const AttachmentModal = (props: ModalProps) => {

    // Store
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

    // States

    // -----

    // Web requests

    // -----

    // Effects

    // -----

    // Handlers

    // -----

    // Columns

    // -----

    return (
        <Modal title={`Приложения`}
               maskClosable={false}
               open={props.visible}
               onCancel={() => props.setVisible(false)}
               width={'700px'}
               loading={false}
               footer={() => (<></>)}
        >

        </Modal>
    );
};
