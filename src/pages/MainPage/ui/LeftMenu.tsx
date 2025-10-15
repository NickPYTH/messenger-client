import { Flex, Divider, FloatButton } from "antd";
import { MessageOutlined } from '@ant-design/icons';
import { TopMenu } from "./TopMenu";
import { ChatItem } from "./ChatItem";

export const LeftMenu = () => {
    return (
        <Flex 
            style={{width: '30vw', background: '#fff'}} 
            vertical>
            <TopMenu/>
            <Divider style={{margin: 0}}/>
            {[1,2,3,4,5,6].map((chat) => {
                return (<ChatItem id={chat}/>);
            })}
                <FloatButton icon={<MessageOutlined />} type="primary" style={{ insetInlineEnd: '80vw' }} />

        </Flex>
    )
}