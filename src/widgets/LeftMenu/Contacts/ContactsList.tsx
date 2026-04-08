import {Button, Empty, Flex, Popover, Spin} from 'antd';
import React, {useEffect, useState} from 'react';
import {ContactItem} from './ContactItem';
import Search from 'antd/es/input/Search';
import {DeleteOutlined} from '@ant-design/icons';
import {userAPI, UserModel } from '../../../entities/user';
import { CONVERSATION_TYPE } from '../../../shared/config/constants';
import { favoritesAPI, FavoritesModel } from '../../../entities/favourites';

type PropsType = {
    setCurrentBottomMenuOption: (s:string)=>void
}

export const ContactsList = (props:PropsType) => {
    // States
    const [searchValue, setSearchValue] = useState('');
    const [usersFiltered, setUsersFiltered] = useState<UserModel[]>([]);
    // -----

    // Web requests
    const [getFavorites, { data: favorites, isLoading: isFavoritesLoading }] =
        favoritesAPI.useGetAllMutation();
    const [getUsers, { data: users, isLoading: isUsersLoading }] = userAPI.useGetAllMutation();
    // -----

    // Effects
    useEffect(() => {
        getFavorites();
    }, []);
    useEffect(() => {
        if (favorites) setUsersFiltered(favorites.map((f: FavoritesModel) => f.friend));
    }, [favorites]);
    useEffect(() => {
        if (users) setUsersFiltered(users);
    }, [users]);
    // -----

    // Handlers
    const searchHandler = () => {
        if (searchValue.trim().length > 1) {
            getUsers(searchValue);
        }
    };
    const clearHandler = () => {
        setSearchValue('');
        getFavorites();
    };
    // -----

    return (
        <Flex vertical gap={'small'} style={{ padding: 5 }}>
            <Flex gap={'small'}>
                <Search
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Поиск"
                    allowClear={true}
                    onSearch={searchHandler}
                />
                <Popover content={'Сбросить поиск'}>
                    <Button
                        onClick={clearHandler}
                        icon={<DeleteOutlined />}
                        style={{width: 35}}
                    />
                </Popover>
            </Flex>
            <Flex vertical gap={'small'} style={{ overflowY: 'hidden', height: window.innerHeight - 145 }}>
                {isFavoritesLoading || isUsersLoading ? (
                    <Spin style={{ marginTop: 50 }} />
                ) : (
                    usersFiltered.map((contact: UserModel) => {
                        return (
                            <ContactItem
                                setCurrentBottomMenuOption={(s:string) => {props.setCurrentBottomMenuOption(s)}}
                                getFavorites={getFavorites}
                                key={contact.id}
                                favoriteId={
                                    favorites?.find(
                                        (f: FavoritesModel) => f.friend.id == contact.id
                                    )?.id
                                }
                                setUsersFiltered={setUsersFiltered}
                                contact={contact}
                                type={CONVERSATION_TYPE.PRIVATE}
                            />
                        );
                    })
                )}
            </Flex>
            {usersFiltered.length == 0 && (
                <Empty
                    description={'В избранном пусто, но вы можете найти людей в поиске'}
                    style={{ marginTop: 50 }}
                />
            )}
        </Flex>
    );
};
