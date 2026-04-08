import { Avatar, Button, Divider, Dropdown, Flex, MenuProps, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { DeleteOutlined, DesktopOutlined, MoreOutlined, SettingOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootStateType } from '../../../app/store/store';
import { ConversationMemberModel, ConversationModel } from '../../../entities/conversation';
import { CONVERSATION_TYPE } from '../../../shared/config/constants';
import { ConfirmChatDeleteModal } from '../../../features/chat/modals/ConfirmChatDeleteModal/ui/ConfirmChatDeleteModal';
import { ChatSettingsModal } from '../../../features/chat/modals/ChatSettingsModal';

const { Text } = Typography;

type PropsType = {
    setVisibleScreenShareModal: (visible: boolean) => void;
    isVirtualHelperConversation: boolean;
};

export const TopMenu = (props: PropsType) => {
    // Store
    const selectedConversation = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );
    const conversations = useSelector((state: RootStateType) => state.currentUser.conversations);
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

    // States
    const [isVisibleConfirmChatDeleteModal, setVisibleConfirmChatDeleteModal] = useState(false);
    const [isVisibleChatSettingsModal, setIsVisibleChatSettingsModal] = useState(false);
    const [conversationMember, setConversationMember] = useState<ConversationMemberModel | null>(
        null
    );
    const [conversationTitle, setConversationTitle] = useState('#Название чата#');
    // -----

    // Web requests

    // -----

    // Effects
    useEffect(() => {
        const conversation: ConversationModel | undefined = conversations.find(
            (c: ConversationModel) => c.id == selectedConversation?.id
        );
        if (conversation) {
            if (conversation.type == CONVERSATION_TYPE.GROUP)
                setConversationTitle(conversation.title);
            else {
                const conversationMember: undefined | ConversationMemberModel =
                    conversation.members?.find(
                        (profile: any) => profile?.user.id != currentUser?.id
                    );
                if (conversationMember) {
                    setConversationTitle(
                        `${conversationMember.user.profile.last_name} ${conversationMember.user.profile.first_name} ${conversationMember.user.profile.second_name}`
                    );
                    setConversationMember(conversationMember);
                } else setConversationTitle('#Название чата#');
            }
        } else setConversationTitle('#Название чата#');
    }, [selectedConversation, conversations]);
    // -----

    // Handlers
    const menuItemsClickHandler = (e: { key: string }) => {
        if (e.key == 'deleteConversation') setVisibleConfirmChatDeleteModal(true);
        if (e.key == 'screenShare') props.setVisibleScreenShareModal(true);
        if (e.key == 'settings') setIsVisibleChatSettingsModal(true);
    };
    // -----

    // Useful utils
    const menuItems: MenuProps['items'] = [
        {
            label: 'Настройки',
            key: 'settings',
            icon: <SettingOutlined />,
        },
        {
            label: 'Показ экрана',
            key: 'screenShare',
            icon: <DesktopOutlined />,
        },
        {
            disabled: props.isVirtualHelperConversation,
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
            {isVisibleChatSettingsModal && (
                <ChatSettingsModal
                    visible={isVisibleChatSettingsModal}
                    setVisible={setIsVisibleChatSettingsModal}
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
                        src={conversationMember?.user.profile.avatar.replace(':9000', '/storage')}
                        size={'large'}
                        style={{ cursor: 'pointer' }}
                    />
                    <Text strong>{conversationTitle}</Text>
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
