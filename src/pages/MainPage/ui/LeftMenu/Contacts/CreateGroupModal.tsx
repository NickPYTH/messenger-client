import React, { useEffect, useState } from 'react';
import { Button, Flex, Input, Modal, Select, Typography } from 'antd';
import { useSelector } from 'react-redux';
import { RootStateType } from '../../../../../store/store';
import { userAPI } from '../../../../../service/UserService';
import { UserModel } from '../../../../../entities/UserModel';
import { conversationsAPI } from '../../../../../service/ConversationsService';

const { Text } = Typography;

type ModalProps = {
    visible: boolean;
    setVisible: Function;
};

export const CreateGroupModal = (props: ModalProps) => {
    // Store
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

    // States
    const [title, setTitle] = useState('');
    const [selectedUserFIOList, setSelectedUserFIOList] = useState<string[]>([]);
    // -----

    // Web requests
    const { data: users, isLoading: isUsersLoading } = userAPI.useGetAllQuery();
    const [createConversation, { data: createdConversation }] =
        conversationsAPI.useCreateGroupMutation();
    // -----

    // Effects
    useEffect(() => {
        if (createdConversation) {
            props.setVisible(false);
        }
    }, [createdConversation]);
    // -----

    // Handlers
    const createConversationHandler = () => {
        if (title.trim().length > 0 && selectedUserFIOList.length > 1) {
            let member_ids: number[] = selectedUserFIOList.map((fio: string) => {
                let user: UserModel | undefined = users?.find(
                    (user: UserModel) =>
                        fio ==
                        `${user.profile.last_name} ${user.profile.first_name} ${user.profile.second_name}`
                );
                if (user) return user.id;
                else return 1;
            });
            createConversation({
                member_ids,
                title,
            });
        }
    };
    // -----

    // Columns

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
            <Flex gap={'small'} vertical align={'center'}>
                <Flex gap={'small'} align={'center'} style={{ width: '100%' }}>
                    <Text style={{ width: 100 }}>Название</Text>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Flex>
                <Flex gap={'small'} align={'center'} style={{ width: '100%' }}>
                    <Text style={{ width: 100 }}>Участники</Text>
                    <Select
                        allowClear={true}
                        value={selectedUserFIOList}
                        mode={'multiple'}
                        loading={isUsersLoading}
                        disabled={isUsersLoading}
                        placeholder={'Выберите участников'}
                        style={{ width: '100%' }}
                        onChange={(e) => setSelectedUserFIOList(e)}
                        options={users?.map((user: UserModel) => ({
                            value: `${user.profile.last_name} ${user.profile.first_name} ${user.profile.second_name}`,
                            label: `${user.profile.last_name} ${user.profile.first_name} ${user.profile.second_name}`,
                        }))}
                    />
                </Flex>
                <Button style={{ width: 100 }} onClick={createConversationHandler}>
                    Создать
                </Button>
            </Flex>
        </Modal>
    );
};
