import { Avatar, Button, Divider, Dropdown, Flex, MenuProps, Typography } from 'antd';
import React, { useState } from 'react';
import { DeleteOutlined, DesktopOutlined, MoreOutlined, SettingOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootStateType } from '../../../../../store/store';
import { ConfirmChatDeleteModal } from './ConfirmChatDeleteModal';

const { Text } = Typography;

type PropsType = {
    setVisibleScreenShareModal: Function;
};

export const TopMenu = (props: PropsType) => {
    // Store
    const dispatch = useDispatch();
    const selectedConversation = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );
    // -----

    // States
    const [isVisibleConfirmChatDeleteModal, setVisibleConfirmChatDeleteModal] = useState(false);
    // -----

    // Web requests

    // -----

    // Effects

    // -----

    // Handlers
    const menuItemsClickHandler = (e: any) => {
        if (e.key == 'deleteConversation') {
            setVisibleConfirmChatDeleteModal(true);
        }
    };
    // -----

    // Useful utils
    const menuItems: MenuProps['items'] = [
        {
            label: 'Настройки',
            key: '1',
            icon: <SettingOutlined />,
        },
        {
            label: 'Показ экрана',
            key: '2',
            icon: <DesktopOutlined />,
        },
        {
            label: 'Удалить чат',
            key: 'deleteConversation',
            danger: true,
            icon: <DeleteOutlined />,
        },
    ];
    // -----

    return (
        <div style={{ width: '100%', height: 46, marginBottom: 2 }}>
            {isVisibleConfirmChatDeleteModal && (
                <ConfirmChatDeleteModal
                    visible={isVisibleConfirmChatDeleteModal}
                    setVisible={setVisibleConfirmChatDeleteModal}
                />
            )}
            <Flex
                gap={'small'}
                justify={'space-between'}
                align={'center'}
                style={{ height: '100%' }}
            >
                <Flex gap={'small'} align={'center'}>
                    <Avatar
                        src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"
                        size={'large'}
                    />
                    <Text strong>{selectedConversation?.title}</Text>
                </Flex>
                <Dropdown menu={{ items: menuItems, onClick: menuItemsClickHandler }}>
                    <Button
                        type={'text'}
                        style={{ color: '#000' }}
                        size={'large'}
                        icon={<MoreOutlined />}
                    />
                </Dropdown>
            </Flex>
            <Divider style={{ width: '100%', margin: 0 }} />
        </div>
    );
};
