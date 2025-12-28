import {Divider, Flex, Radio} from "antd";
import React, {useState} from "react";
import {CheckboxGroupProps} from "antd/es/checkbox";
import {TopMenu} from "./TopMenu";
import {ConversationsList} from "./Conversations/ConversationsList";
import {ContactsList} from "./Contacts/ContactsList";

export const LeftMenu = () => {

    // States
    const [currentBottomMenuOption, setCurrentBottomMenuOption] = useState("chats");
    // -----

    // Useful utils
    const bottomMenuOptions: CheckboxGroupProps<string>['options'] = [
        { label: 'Контакты', value: 'contacts' },
        { label: 'Чаты', value: 'chats' },
    ];
    // -----

    return (
        <Flex 
            style={{minWidth: '30vw', background: '#fff'}}
            vertical>
            <TopMenu/>
            <Divider style={{margin: 0}}/>
            <Flex vertical justify={'space-between'} style={{height: '100%'}}>
                {currentBottomMenuOption == "chats" && <ConversationsList />}
                {currentBottomMenuOption == "contacts" && <ContactsList />}
                <Radio.Group
                    block
                    value={currentBottomMenuOption}
                    onChange={(e) => setCurrentBottomMenuOption(e.target.value)}
                    options={bottomMenuOptions}
                    defaultValue="chats"
                    optionType="button"
                    buttonStyle="solid"
                    style={{margin: 10}}
                />
            </Flex>
        </Flex>
    )
}