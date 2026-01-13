import { Button, Empty, Flex, Popover, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { ContactItem } from './ContactItem';
import Search from 'antd/es/input/Search';
import { UserModel } from 'entities/UserModel';
import { favoritesAPI } from '../../../../../service/FavortiesService';
import { FavoritesModel } from '../../../../../entities/FavoritesModel';
import { userAPI } from '../../../../../service/UserService';
import { DeleteOutlined } from '@ant-design/icons';

export const ContactsList = () => {
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
        <Flex vertical gap={'small'} style={{ overflowY: 'scroll' }}>
            <Search
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ padding: 5, position: 'absolute', width: 225, zIndex: 100 }}
                placeholder="Поиск"
                allowClear={true}
                onSearch={searchHandler}
            />
            <Popover content={'Сбросить поиск'}>
                <Button
                    onClick={clearHandler}
                    icon={<DeleteOutlined />}
                    style={{ position: 'absolute', width: 35, zIndex: 100, left: 225, top: 60 }}
                />
            </Popover>
            <Flex vertical gap={'small'} style={{ marginTop: 35 }}>
                {isFavoritesLoading || isUsersLoading ? (
                    <Spin style={{ marginTop: 50 }} />
                ) : (
                    usersFiltered.map((contact: UserModel) => {
                        return (
                            <ContactItem
                                key={contact.id}
                                favoriteId={
                                    favorites?.find(
                                        (f: FavoritesModel) => f.friend.id == contact.id
                                    )?.id
                                }
                                setUsersFiltered={setUsersFiltered}
                                contact={contact}
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
