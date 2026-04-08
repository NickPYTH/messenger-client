import React, { useEffect, useState } from 'react';
import { Button, Divider, Empty, Flex, Input, Modal, Popover, Spin, Typography } from 'antd';
import Search from 'antd/es/input/Search';
import { DeleteOutlined } from '@ant-design/icons';
import { ModalProps } from '../model/types';
import { userAPI, UserModel } from 'entities/user';
import { conversationsAPI } from 'entities/conversation';
import { ContactItem } from 'widgets/LeftMenu/Contacts/ContactItem';
import { CONVERSATION_TYPE } from '../../../../../shared/config/constants';

const { Text } = Typography;

const CreateGroupModal = (props: ModalProps) => {
    // Store

    // -----

    // States
    const [title, setTitle] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [users, setUsers] = useState<UserModel[]>([]);
    const [groupUsers, setGroupUsers] = useState<UserModel[]>([]);
    // -----

    // Web requests
    const [createConversation, { data: createdConversation }] =
        conversationsAPI.useCreateGroupMutation();
    const [getUsers, { data: usersFromRequest, isLoading: isUsersLoading }] =
        userAPI.useGetAllMutation();
    // -----

    // Effects
    useEffect(() => {
        if (usersFromRequest) setUsers(usersFromRequest);
    }, [usersFromRequest]);
    useEffect(() => {
        if (createdConversation) {
            props.setVisible(false);
        }
    }, [createdConversation]);
    // -----

    // Handlers
    const createConversationHandler = () => {
        if (title.trim().length > 3 && groupUsers.length > 1) {
            console.log('create');
            createConversation({
                member_ids: groupUsers.map((u: UserModel) => u.id),
                title,
            });
        }
    };
    const searchHandler = () => {
        if (searchValue.trim().length > 1) {
            getUsers(searchValue);
        }
    };
    const clearHandler = () => {
        setSearchValue('');
        setUsers([]);
    };
    // -----

    return (
        <Modal
            title={`Создание группы`}
            maskClosable={false}
            open={props.visible}
            onCancel={() => props.setVisible(false)}
            width={'500px'}
            loading={false}
            footer={() => <></>}
        >
            <Flex gap={'small'} vertical>
                <Flex gap={'small'} align={'center'} style={{ width: '99%' }}>
                    <Text style={{ width: 100 }}>Название</Text>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Flex>

                <Flex gap={'small'}>
                    <Search
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Поиск собеседников"
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
                        users.map((contact: UserModel) => {
                            return (
                                <ContactItem
                                    getFavorites={() => {}}
                                    key={contact.id}
                                    favoriteId={0}
                                    setUsersFiltered={setGroupUsers}
                                    contact={contact}
                                    type={CONVERSATION_TYPE.GROUP}
                                    mode={'add'}
                                />
                            );
                        })
                    )}
                </Flex>

                <Divider style={{ margin: 0 }} />
                <Text>Участники группы:</Text>
                {groupUsers.length == 0 ? (
                    <Empty description={'Пока тут никого...'} />
                ) : (
                    groupUsers.map((contact: UserModel) => {
                        return (
                            <ContactItem
                                getFavorites={() => {}}
                                key={contact.id}
                                favoriteId={0}
                                setUsersFiltered={setGroupUsers}
                                contact={contact}
                                type={CONVERSATION_TYPE.GROUP}
                            />
                        );
                    })
                )}
                <Button style={{ width: 100 }} onClick={createConversationHandler}>
                    Создать
                </Button>
            </Flex>
        </Modal>
    );
};

export default CreateGroupModal;
