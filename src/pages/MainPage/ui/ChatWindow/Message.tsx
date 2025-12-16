import {MessageModel} from "../../../../entities/MessageModel";
import {Flex} from "antd";

type PropsType = {
    data: MessageModel;
    fromYou: boolean;
}

export const Message = (props:PropsType) => {
    return(
        <div className="message" style={{display: 'flex', alignSelf: props.fromYou ? 'end' : 'start'}}>
            <Flex vertical gap={'small'}>
                <Flex>{props.data.text}</Flex>
                <Flex style={{fontSize: 10}}>{props.data.sent_at}</Flex>
            </Flex>
        </div>
    )
}