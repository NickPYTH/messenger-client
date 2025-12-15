import {Avatar, Flex, Typography} from "antd"
import {ConversationModel} from "../../../../../entities/ConversationModel";
import {useDispatch, useSelector} from "react-redux";
import {setSelectedConversationId} from "../../../../../store/slice/GeneralSlice";
import {useEffect} from "react";
import {RootStateType} from "../../../../../store/store";

const { Text } = Typography;

type PropsType = {
    conversation: ConversationModel;
}

export const ConversationItem = (props:PropsType) => {

    // Store
    const dispatch = useDispatch();
    const selectedConversationId = useSelector((state: RootStateType) => state.currentUser.selectedConversationId);
    // -----

    // Effects

    // -----

    // Handlers
    const selectConversationIdHandler = () => {
        if (selectedConversationId == props.conversation.id)
            dispatch(setSelectedConversationId(null));
        else
            dispatch(setSelectedConversationId(props.conversation.id));
    }
    // -----

    return(
        <Flex vertical className="chatItem" onClick={selectConversationIdHandler}>
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
