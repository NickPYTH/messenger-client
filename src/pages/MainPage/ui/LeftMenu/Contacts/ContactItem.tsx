import {Flex, Divider, Avatar, Typography, Button} from "antd"
import {MessageOutlined} from '@ant-design/icons';
import {UserModel} from "../../../../../entities/UserModel";

const { Text } = Typography;

type PropsType = {
    contact: UserModel;
}

export const ContactItem = (props:PropsType) => {
    return(
        <Flex className="chatItem" justify={'space-between'} align={'center'}>
            <Flex align={"center"} gap={'small'}>
                <Avatar src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"  size={"large"}/>
                <Flex gap={'small'} align={'center'}>
                    <Flex vertical justify="space-between">
                        <Text>{props.contact.profile.last_name} {props.contact.profile.first_name} {props.contact.profile.second_name}</Text>
                        <Text style={{fontSize: 12}}>{props.contact.profile.staff}</Text>
                    </Flex>
                </Flex>
            </Flex>
            <Button type={'link'} icon={<MessageOutlined />}/>
        </Flex>
    )
}