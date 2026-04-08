import React from 'react';
import { Avatar, Flex, Modal } from 'antd';
import { useSelector } from 'react-redux';
import { RootStateType } from '../../../../../app/store/store';
import { ModalProps } from '../model/types';

const ProfileModal = (props: ModalProps) => {
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
        <Modal
            title={``}
            maskClosable={false}
            open={props.visible}
            onCancel={() => props.setVisible(false)}
            width={'700px'}
            loading={false}
            footer={() => <></>}
        >
            <Flex gap={'small'} vertical align={'center'} justify={'center'}>
                <Avatar
                    src={currentUser?.profile.avatar.replace(':9000', '/storage')}
                    size={'large'}
                />
                <div>
                    {currentUser?.profile.last_name} {currentUser?.profile.first_name}{' '}
                    {currentUser?.profile.second_name}
                </div>
                <div>
                    {currentUser?.profile.filial}, {currentUser?.profile.staff}
                </div>
                <div>{currentUser?.profile.phone}</div>
            </Flex>
        </Modal>
    );
};

export default ProfileModal;
