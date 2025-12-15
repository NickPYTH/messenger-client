import {Empty, Flex, Spin} from "antd";
import React, {useEffect} from "react";
import {ContactItem} from "./ContactItem";
import {userAPI} from "../../../../../service/UserService";
import {UserModel} from "../../../../../entities/UserModel";

export const ContactsList = () => {

    // Web requests
    const {
        data: users,
        isLoading: isUsersLoading,
        error: isUsersLoadingError,
        refetch: refetchUsers
    } = userAPI.useGetAllQuery();
    // -----

    // Effects
    useEffect(() => {
        refetchUsers();
    }, []);
    // -----

    return <Flex vertical>
        {users?.map((contact:UserModel) => {
            return (<ContactItem contact={contact}/>);
        })}
        {isUsersLoading && <Spin style={{marginTop: 50}}/>}
        {users?.length == 0 && <Empty style={{marginTop: 50}}/>}
    </Flex>
}
