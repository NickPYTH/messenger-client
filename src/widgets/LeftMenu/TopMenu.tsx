import { Avatar, Button, Flex, Popover } from 'antd';
import { UsergroupAddOutlined, ReloadOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootStateType } from 'app/store/store';
import { CreateGroupModal } from 'features/contacts/modals/CreateGroupModal';
import { ProfileModal } from 'features/profile/modals/ProfileModal';

export const TopMenu = () => {
    // Store
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

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
                src={currentUser?.profile.avatar.replace(':9000', '/storage')}
                size={'large'}
                onClick={() => setIsProfileModalVisible(true)}
                style={{ cursor: 'pointer' }}
            />
            Чаты
            <Flex gap={'small'}>
                <Popover content={'Создать групповой чат'}>
                    <Button
                        icon={<UsergroupAddOutlined />}
                        style={{ margin: '0 5px 0 5px' }}
                        onClick={() => setVisibleCreateGroupModal(true)}
                    />
                </Popover>
                <Popover content={'Обновить'}>
                    <Button icon={<ReloadOutlined />} onClick={() => location.reload()} />
                </Popover>
            </Flex>
        </Flex>
    );
};
