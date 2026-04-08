import {Avatar, Button, Flex, Popover, Typography} from 'antd';
import {HeartFilled, HeartOutlined, MessageOutlined, MinusOutlined, PlusOutlined} from '@ant-design/icons';
import React, {Dispatch, SetStateAction, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { setSelectedConversation } from '../../../app/store/slice/GeneralSlice';
import { UserModel } from '../../../entities/user';
import { CONVERSATION_TYPE } from '../../../shared/config/constants';
import { RootStateType } from '../../../app/store/store';
import { conversationsAPI } from '../../../entities/conversation';
import { favoritesAPI, FavoritesModel } from '../../../entities/favourites';

const { Text } = Typography;

type PropsType = {
    contact: UserModel;
    favoriteId: number | undefined;
    setUsersFiltered: Dispatch<SetStateAction<UserModel[]>>;
    getFavorites: ()=>void;
    type: CONVERSATION_TYPE;
    mode?: string;
    setCurrentBottomMenuOption?: (s:string)=>void
};

export const ContactItem = (props: PropsType) => {
    // Store
    const dispatch = useDispatch();
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

    // Web requests
    const [createConversation, { data: createdConversation, error: errorCreateConversation }] =
        conversationsAPI.useCreateMutation();
    const [createFavorite, {isSuccess: isCreateFavoriteSuccess}] = favoritesAPI.useCreateMutation();
    const [deleteFavorite, { isSuccess: isDeleteFavoriteSuccess }] = favoritesAPI.useDeleteMutation();
    // -----

    // Effects
    useEffect(() => {
        if (createdConversation) {
            dispatch(setSelectedConversation(createdConversation));
            if (props.setCurrentBottomMenuOption) {
                props.setCurrentBottomMenuOption('chats');
            }
        }
    }, [createdConversation]);
    useEffect(() => {
        if (errorCreateConversation) {
            //@ts-expect-error Ответ с сервера при ошибке
            dispatch(setSelectedConversation(errorCreateConversation.data.existing_conversation));
            if (props.setCurrentBottomMenuOption) {
                props.setCurrentBottomMenuOption('chats');
            }
        }
    }, [errorCreateConversation]);
    useEffect(() => {
        if (isDeleteFavoriteSuccess)
            props.setUsersFiltered((prev: UserModel[]) => prev.filter((u: UserModel) => u.id != props.contact.id));
    }, [isDeleteFavoriteSuccess]);
    useEffect(() => {
        if (isCreateFavoriteSuccess) {
            props.getFavorites();
        }
    }, [isCreateFavoriteSuccess])
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
    const addToGroupHandler = () => {
        props.setUsersFiltered((prev) => prev.concat([props.contact]))
    };
    const removeFromGroupHandler = () => {
        props.setUsersFiltered((prev) => prev.filter((p:UserModel) => p.id !=props.contact.id));
    };
    // -----

    return (
        <Flex className="chatItem" justify="space-between" align="center">
            <Flex align={'center'} gap={'small'}>
                <div style={{width: 40}}>
                    <Avatar
                        style={{width: 40, height: 40}}
                        src={props.contact.profile.avatar?.replace(":9000", "/storage")}
                    />
                </div>
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
                {props.type == CONVERSATION_TYPE.PRIVATE &&
                    <>
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
                            <Popover content={'Перейти в чат'}>
                                <Button type={'link'} onClick={createConversationHandler} icon={<MessageOutlined />} />
                            </Popover>
                        )}
                    </> }
                    {props.type == CONVERSATION_TYPE.GROUP &&
                        <>
                        {props.mode == 'add' ?
                            <Popover content={'Добавить в группу'} placement={'right'}>
                                <Button onClick={addToGroupHandler} icon={<PlusOutlined />} />
                            </Popover>
                            :
                            <Popover content={'Убрать из группы'} placement={'right'}>
                                <Button onClick={removeFromGroupHandler} icon={<MinusOutlined />} />
                            </Popover>
                        }
                        </>
                    }
            </Flex>
        </Flex>
    );
};
