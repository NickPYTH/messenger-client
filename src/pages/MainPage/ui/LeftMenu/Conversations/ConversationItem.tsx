import { Flex, Divider, Avatar, Typography } from "antd"
import {ConversationModel} from "../../../../../entities/ConversationModel";

const { Text } = Typography;

type PropsType = {
    conversation: ConversationModel;
}

export const ConversationItem = (props:PropsType) => {
    return(
        <Flex vertical className="chatItem">
            <Flex align={"center"} gap={'small'}>
                <Avatar src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"  size={"large"}/>
                <Flex vertical justify="space-between">
                    <Text>{props.conversation.id} {props.conversation.title}</Text>
                    <Text style={{fontSize: 12}}>{props.conversation.type}</Text>
                </Flex>
            </Flex>
        </Flex>
    )
}
