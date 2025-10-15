import {Flex} from "antd";

type PropsType = {
    text: string;
    fromYou: boolean;
}

export const Message = (props:PropsType) => {
    return(
        <div className="message" style={{display: 'flex', alignSelf: props.fromYou ? 'end' : 'start'}}>
            {props.text}
        </div>
    )
}