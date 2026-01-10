import { Avatar, Button, Flex, Popover } from 'antd';
import { UsergroupAddOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { ProfileModal } from '../ProfileModal/ProfileModal';
import { CreateGroupModal } from './Contacts/CreateGroupModal';

export const TopMenu = () => {
    // States
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [visibleCreateGroupModal, setVisibleCreateGroupModal] = useState(false);
    // -----

    return (
        <Flex style={{ padding: 7 }} justify="space-between" align={'center'}>
            {visibleCreateGroupModal && (
                <CreateGroupModal
                    visible={visibleCreateGroupModal}
                    setVisible={setVisibleCreateGroupModal}
                />
            )}
            {isProfileModalVisible && (
                <ProfileModal
                    visible={isProfileModalVisible}
                    setVisible={setIsProfileModalVisible}
                />
            )}
            <Avatar
                onClick={() => setIsProfileModalVisible(true)}
                style={{ minWidth: 40, cursor: 'pointer' }}
                src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"
                size={'large'}
            />
            Чаты
            <Popover content={'Создать групповой чат'}>
                <Button
                    icon={<UsergroupAddOutlined />}
                    style={{ margin: '0 5px 0 5px' }}
                    onClick={() => setVisibleCreateGroupModal(true)}
                />
            </Popover>
        </Flex>
    );
};
