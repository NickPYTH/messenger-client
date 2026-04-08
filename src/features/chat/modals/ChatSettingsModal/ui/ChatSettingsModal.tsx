import { Avatar, Button, Empty, Flex, Input, Modal, Popover, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CONVERSATION_TYPE } from '../../../../../shared/config/constants';
import Search from 'antd/es/input/Search';
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { RootStateType } from '../../../../../app/store/store';
import { userAPI, UserModel } from '../../../../../entities/user';
import { conversationsAPI } from '../../../../../entities/conversation/api/conversationApi';
import { ConversationMemberModel } from '../../../../../entities/conversation';
import { PropsType } from '../model/types';

const { Text } = Typography;

const ChatSettingsModal = (props: PropsType) => {
    // Store
    const selectedConversationId = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation?.id
    );
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

    // States
    const [conversationType, setConversationType] = useState<string>(CONVERSATION_TYPE.PRIVATE);
    const [title, setTitle] = useState('#Название чата#');
    const [searchValue, setSearchValue] = useState('');
    const [users, setUsers] = useState<UserModel[]>([]);
    const [groupUsers, setGroupUsers] = useState<ConversationMemberModel[]>([]);
    // -----

    // Web requests
    const [getConversation, { data: conversation, isLoading: isConversationLoading }] =
        conversationsAPI.useGetMutation();
    const [updateConversation, { isSuccess: isUpdateConversationSuccess }] =
        conversationsAPI.useUpdateMutation();
    const [getUsers, { data: usersFromRequest, isLoading: isUsersLoading }] =
        userAPI.useGetAllMutation();
    // -----

    // Effects
    useEffect(() => {
        if (selectedConversationId) getConversation(selectedConversationId);
    }, []);
    useEffect(() => {
        if (conversation) {
            setConversationType(conversation.type);
            if (conversation.type == CONVERSATION_TYPE.GROUP) {
                setTitle(conversation.title);
                const conversationMembers: ConversationMemberModel[] = conversation.members
                    ? (conversation.members as ConversationMemberModel[])
                    : [];
                setGroupUsers(conversationMembers);
            } else {
                const profile: ConversationMemberModel = conversation.members.find(
                    (m: ConversationMemberModel) =>
                        m.user.id == (conversation.created_by as unknown as number)
                );
                if (profile)
                    setTitle(
                        `${profile.user.profile.last_name} ${profile.user.profile.first_name} ${profile.user.profile.second_name}`
                    );
                else setTitle('#Название чата#');
            }
        }
    }, [conversation]);
    useEffect(() => {
        if (usersFromRequest) {
            setUsers(usersFromRequest);
        }
    }, [usersFromRequest]);
    useEffect(() => {
        if (isUpdateConversationSuccess) props.setVisible(false);
    }, [isUpdateConversationSuccess]);
    // -----

    // Handlers
    const updateConversationHandler = () => {
        if (title.trim() && conversation && groupUsers.length > 0) {
            updateConversation({ ...conversation, members: groupUsers, title });
        }
    };
    const clearHandler = () => {
        setSearchValue('');
        setUsers([]);
    };
    const searchHandler = () => {
        if (searchValue.trim().length > 1) {
            getUsers(searchValue);
        }
    };
    const addToConversationHandler = (user: UserModel) => {
        const conversationMember: ConversationMemberModel = {
            role: 'member',
            user,
        };
        setGroupUsers((prev) => prev.concat([conversationMember]));
    };
    const deleteConversationMemberHandler = (member: ConversationMemberModel) => {
        setGroupUsers((prev) =>
            prev.filter((m: ConversationMemberModel) => m.user.id != member.user.id)
        );
    };
    // -----

    return (
        <Modal
            title={`Настройки`}
            open={props.visible}
            onCancel={() => props.setVisible(false)}
            width={550}
            footer={<></>}
        >
            {isConversationLoading ? (
                <Flex style={{ width: '100%', marginTop: 100 }} justify={'center'}>
                    <Spin size={'large'} />
                </Flex>
            ) : (
                <Flex gap={'small'} vertical>
                    <Flex gap={'small'} align={'center'} style={{ width: '99%' }}>
                        <Text style={{ width: 100 }}>Название</Text>
                        <Input
                            disabled={conversationType == CONVERSATION_TYPE.PRIVATE}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </Flex>
                    {conversationType == CONVERSATION_TYPE.GROUP &&
                        conversation?.members.find(
                            (member: ConversationMemberModel) =>
                                member.user.id == currentUser?.id && member.role == 'admin'
                        ) && (
                            <>
                                <Flex gap={'small'}>
                                    <Search
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder="Добавить собеседников"
                                        allowClear={true}
                                        onSearch={searchHandler}
                                    />
                                    <Popover content={'Сбросить поиск'}>
                                        <Button
                                            onClick={clearHandler}
                                            icon={<DeleteOutlined />}
                                            style={{ width: 36, marginRight: 5 }}
                                        />
                                    </Popover>
                                </Flex>

                                <Flex vertical gap={'small'} style={{ overflowY: 'hidden' }}>
                                    {isUsersLoading ? (
                                        <Spin style={{ marginTop: 50 }} />
                                    ) : (
                                        users.map((user: UserModel) => {
                                            return (
                                                <Flex
                                                    key={user.id}
                                                    className="chatItem"
                                                    justify="space-between"
                                                    align="center"
                                                >
                                                    <Flex align={'center'} gap={'small'}>
                                                        <Avatar
                                                            src={user.profile.avatar.replace(
                                                                ':9000',
                                                                '/storage'
                                                            )}
                                                            size={'small'}
                                                        />
                                                        <Flex gap={'small'} align={'center'}>
                                                            <Flex vertical justify="space-between">
                                                                <Text>
                                                                    {user.profile.last_name}{' '}
                                                                    {user.profile.first_name}{' '}
                                                                    {user.profile.second_name}
                                                                </Text>
                                                                <Text style={{ fontSize: 12 }}>
                                                                    {user.profile.staff}
                                                                </Text>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                    <Popover
                                                        content={'Добавить в группу'}
                                                        placement={'right'}
                                                    >
                                                        <Button
                                                            size={'small'}
                                                            onClick={() =>
                                                                addToConversationHandler(user)
                                                            }
                                                            icon={<PlusOutlined />}
                                                        />
                                                    </Popover>
                                                </Flex>
                                            );
                                        })
                                    )}
                                </Flex>

                                <Text>Участники группы:</Text>
                                {groupUsers.length == 0 ? (
                                    <Empty description={'Пока тут никого...'} />
                                ) : (
                                    groupUsers.map(
                                        (conversationMember: ConversationMemberModel) => {
                                            return (
                                                <Flex
                                                    key={conversationMember.user.id}
                                                    className="chatItem"
                                                    justify="space-between"
                                                    align="center"
                                                >
                                                    <Flex align={'center'} gap={'small'}>
                                                        <Avatar
                                                            src={conversationMember.user.profile.avatar.replace(
                                                                ':9000',
                                                                '/storage'
                                                            )}
                                                            size={'small'}
                                                        />
                                                        <Flex gap={'small'} align={'center'}>
                                                            <Flex vertical justify="space-between">
                                                                <Text>
                                                                    {
                                                                        conversationMember.user
                                                                            .profile.last_name
                                                                    }{' '}
                                                                    {
                                                                        conversationMember.user
                                                                            .profile.first_name
                                                                    }{' '}
                                                                    {
                                                                        conversationMember.user
                                                                            .profile.second_name
                                                                    }{' '}
                                                                    {conversationMember.role ==
                                                                        'admin' && (
                                                                        <Tag color={'blue'}>
                                                                            Администратор
                                                                        </Tag>
                                                                    )}
                                                                </Text>
                                                                <Text style={{ fontSize: 12 }}>
                                                                    {
                                                                        conversationMember.user
                                                                            .profile.staff
                                                                    }
                                                                </Text>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                    {currentUser?.id !=
                                                        conversationMember.user.id && (
                                                        <Popover
                                                            content={'Удалить из группы'}
                                                            placement={'right'}
                                                        >
                                                            <Button
                                                                size={'small'}
                                                                onClick={() =>
                                                                    deleteConversationMemberHandler(
                                                                        conversationMember
                                                                    )
                                                                }
                                                                icon={<MinusOutlined />}
                                                            />
                                                        </Popover>
                                                    )}
                                                </Flex>
                                            );
                                        }
                                    )
                                )}
                            </>
                        )}

                    <Button style={{ width: 100 }} onClick={updateConversationHandler}>
                        Сохранить
                    </Button>
                </Flex>
            )}
        </Modal>
    );
};

export default ChatSettingsModal;
