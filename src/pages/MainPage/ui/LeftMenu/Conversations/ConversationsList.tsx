import {ConversationItem} from "./ConversationItem";
import {Flex, Spin} from "antd";
import React, {useEffect} from "react";
import {conversationsAPI} from "../../../../../service/ConversationsService";
import {ConversationModel} from "../../../../../entities/ConversationModel";

export const ConversationsList = () => {

    // Web requests
    const {
        data: conversations,
        isLoading: isConversationsLoading,
        error: isConversationsLoadingError,
        refetch: refetchConversations
    } = conversationsAPI.useGetAllQuery();
    // -----

    // Effects
    useEffect(() => {
        refetchConversations();
    }, []);
    // -----

    return <Flex vertical>
        {conversations?.map((conversation:ConversationModel) => {
            return (<ConversationItem conversation={conversation}/>);
        })}
        {isConversationsLoading && <Spin style={{marginTop: 50}}/>}
    </Flex>
}
