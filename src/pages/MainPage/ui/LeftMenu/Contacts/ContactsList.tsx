import { Button, Empty, Flex, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { ContactItem } from './ContactItem';
import { userAPI } from '../../../../../service/UserService';
import { UserModel } from '../../../../../entities/UserModel';
import Search from 'antd/es/input/Search';
import { CreateGroupModal } from './CreateGroupModal';

export const ContactsList = () => {
    // States
    const [searchValue, setSearchValue] = useState('');
    const [usersFiltered, setUsersFiltered] = useState<UserModel[]>([]);
    // -----

    // Web requests
    const {
        data: users,
        isLoading: isUsersLoading,
        refetch: refetchUsers,
    } = userAPI.useGetAllQuery();
    // -----

    // Effects
    useEffect(() => {
        refetchUsers();
    }, []);
    useEffect(() => {
        if (users) setUsersFiltered(users);
    }, [users]);
    // -----

    // Handlers
    const searchHandler = () => {
        if (searchValue.trim() && users) {
            setUsersFiltered(
                users.filter(
                    (u: UserModel) =>
                        u.username.toLowerCase().includes(searchValue.toLowerCase()) ||
                        u.profile.first_name.toLowerCase().includes(searchValue.toLowerCase()) ||
                        u.profile.last_name.toLowerCase().includes(searchValue.toLowerCase()) ||
                        u.profile.second_name.toLowerCase().includes(searchValue.toLowerCase())
                )
            );
        } else {
            if (users) setUsersFiltered(users);
        }
    };
    // -----

    return (
        <Flex vertical gap={'small'}>
            <Search
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ padding: 5 }}
                placeholder="Поиск"
                onSearch={searchHandler}
            />
            {isUsersLoading ? (
                <Spin style={{ marginTop: 50 }} />
            ) : (
                usersFiltered.map((contact: UserModel) => {
                    return <ContactItem contact={contact} />;
                })
            )}
            {usersFiltered.length == 0 && (
                <Empty description={'Пользователи не найдены'} style={{ marginTop: 50 }} />
            )}
        </Flex>
    );
};
