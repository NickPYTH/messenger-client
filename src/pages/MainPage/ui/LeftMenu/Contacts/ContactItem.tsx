import { Flex, Divider, Avatar, Typography, Button, Popover } from 'antd';
import { MessageOutlined, HeartOutlined } from '@ant-design/icons';
import { UserModel } from '../../../../../entities/UserModel';
import { conversationsAPI } from '../../../../../service/ConversationsService';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedConversation } from '../../../../../store/slice/GeneralSlice';
import { RootStateType } from '../../../../../store/store';

const { Text } = Typography;

type PropsType = {
    contact: UserModel;
};

type ErrorCreateConversationType = {
    status: number;
    data: {
        existing_conversation_id: string[];
    };
};

export const ContactItem = (props: PropsType) => {
    // Store
    const dispatch = useDispatch();
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    const selectedConversationId = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );
    // -----

    // Web requests
    const [createConversation, { data: createdConversation, error: errorCreateConversation }] =
        conversationsAPI.useCreateMutation();
    // -----

    // Effects
    useEffect(() => {
        if (createdConversation) {
            dispatch(setSelectedConversation(createdConversation));
        }
    }, [createdConversation]);
    useEffect(() => {
        if (errorCreateConversation) {
            let error: ErrorCreateConversationType =
                errorCreateConversation as unknown as ErrorCreateConversationType;
            //dispatch(setSelectedConversation(parseInt(error.data.existing_conversation_id[0])));
        }
    }, [errorCreateConversation]);
    // -----

    // Handlers
    const createConversationHandler = () => {
        let member_ids = [props.contact.id];
        createConversation({ member_ids });
    };
    // -----

    return (
        <Flex className="chatItem" justify="space-between" align="center">
            <Flex align={'center'} gap={'small'}>
                <Avatar
                    style={{ height: 50, minWidth: 50 }}
                    src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"
                    size={'large'}
                />
                <Flex gap={'small'} align={'center'}>
                    <Flex vertical justify="space-between">
                        <Text>
                            {props.contact.profile.last_name} {props.contact.profile.first_name}{' '}
                            {props.contact.profile.second_name}
                        </Text>
                        <Text style={{ fontSize: 12 }}>{props.contact.profile.staff}</Text>
                    </Flex>
                </Flex>
            </Flex>
            <Flex>
                <Popover content={'Добавить в избранное'}>
                    <Button
                        type={'link'}
                        onClick={createConversationHandler}
                        icon={<HeartOutlined />}
                    />
                </Popover>
                {props.contact.id != currentUser?.id && (
                    <Button
                        type={'link'}
                        onClick={createConversationHandler}
                        icon={<MessageOutlined />}
                    />
                )}
            </Flex>
        </Flex>
    );
};
