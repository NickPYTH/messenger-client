import React from 'react';
import {Avatar, Flex, Modal} from 'antd';
import {RootStateType} from "../../../store/store";
import {useSelector} from "react-redux";

type ModalProps = {
    visible: boolean;
    setVisible: Function;
}

export const ProfileModal = (props: ModalProps) => {

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
        <Modal title={``}
               maskClosable={false}
               open={props.visible}
               onCancel={() => props.setVisible(false)}
               width={'700px'}
               loading={false}
               footer={() => (<></>)}
        >
            <Flex gap={'small'} vertical align={'center'} justify={'center'}>
                <Avatar src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"  size={"large"}/>
                <div>{currentUser?.profile.last_name} {currentUser?.profile.first_name} {currentUser?.profile.second_name}</div>
                <div>{currentUser?.profile.filial}, {currentUser?.profile.staff}</div>
                <div>{currentUser?.profile.phone}</div>
            </Flex>
        </Modal>
    );
};
