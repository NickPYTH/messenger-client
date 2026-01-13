import { Flex, Avatar, Typography, Button, Popover } from 'antd';
import { MessageOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserModel } from 'entities/UserModel';
import { RootStateType } from 'store/store';
import { conversationsAPI } from 'service/ConversationsService';
import { setSelectedConversation } from 'store/slice/GeneralSlice';
import { favoritesAPI } from '../../../../../service/FavortiesService';
import { FavoritesModel } from '../../../../../entities/FavoritesModel';

const { Text } = Typography;

type PropsType = {
    contact: UserModel;
    favoriteId: number | undefined;
    setUsersFiltered: Dispatch<SetStateAction<UserModel[]>>;
};

export const ContactItem = (props: PropsType) => {
    // Store
    const dispatch = useDispatch();
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

    // Web requests
    const [createConversation, { data: createdConversation, error: errorCreateConversation }] =
        conversationsAPI.useCreateMutation();
    const [createFavorite] = favoritesAPI.useCreateMutation();
    const [deleteFavorite, { isSuccess: isDeleteFavoriteSuccess }] = favoritesAPI.useDeleteMutation();
    // -----

    // Effects
    useEffect(() => {
        if (createdConversation) {
            dispatch(setSelectedConversation(createdConversation));
        }
    }, [createdConversation]);
    useEffect(() => {
        if (errorCreateConversation) {
            //dispatch(setSelectedConversation(parseInt(error.data.existing_conversation_id[0])));
        }
    }, [errorCreateConversation]);
    useEffect(() => {
        if (isDeleteFavoriteSuccess)
            props.setUsersFiltered((prev: UserModel[]) => prev.filter((u: UserModel) => u.id != props.contact.id));
    }, [isDeleteFavoriteSuccess]);
    // -----

    // Handlers
    const createConversationHandler = () => {
        const member_ids = [props.contact.id];
        createConversation({ member_ids });
    };
    const createFavoriteHandler = () => {
        if (currentUser) {
            const favorite: FavoritesModel = {
                user: currentUser,
                friend: props.contact,
            };
            createFavorite(favorite);
        }
    };
    const deleteFavoriteHandler = () => {
        if (props.favoriteId) deleteFavorite(props.favoriteId);
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
                {!props.favoriteId ? (
                    <Popover content={'Добавить в избранное'}>
                        <Button type={'link'} onClick={createFavoriteHandler} icon={<HeartOutlined />} />
                    </Popover>
                ) : (
                    <Popover content={'Удалить из избранного'}>
                        <Button type={'link'} onClick={deleteFavoriteHandler} icon={<HeartFilled />} />
                    </Popover>
                )}
                {props.contact.id != currentUser?.id && (
                    <Button type={'link'} onClick={createConversationHandler} icon={<MessageOutlined />} />
                )}
            </Flex>
        </Flex>
    );
};
