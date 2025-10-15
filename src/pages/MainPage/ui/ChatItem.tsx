import { Flex, Divider, Avatar, Typography } from "antd"

const { Text } = Typography;

type PropsType = {
    id: number;
}

export const ChatItem = (props:PropsType) => {
    return(
        <Flex vertical className="chatItem">
            <Flex align={"center"} gap={'small'}>
                <Avatar src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"  size={"large"}/>
                <Flex vertical justify="space-between">
                    <Text>Contact name</Text>
                    <Text style={{fontSize: 12}}>Chat item {props.id}</Text>
                </Flex>
            </Flex>
        </Flex>
    )
}
