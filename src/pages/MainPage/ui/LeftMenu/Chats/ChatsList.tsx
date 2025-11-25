import {ChatItem} from "./ChatItem";
import {Flex} from "antd";
import React from "react";

export const ChatsList = () => {
    return <Flex vertical>
        {[1,2,3,4,5,6].map((chat) => {
            return (<ChatItem id={chat}/>);
        })}
    </Flex>
}
