import {MessageModel} from "../../../../entities/MessageModel";
import {Flex, Upload} from "antd";
import {AttachmentModel} from "../../../../entities/AttachmentModel";
import {host} from "../../../../shared/config/constants";

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
                {props.data.attachments &&
                    <Upload
                        defaultFileList={props.data.attachments.map((file:AttachmentModel) =>({
                            uid: file.id.toString(),
                            name: file.file_name.length > 37 ? file.file_name.slice(0, 37) : file.file_name,
                            status: 'done',
                            url: `${host}${file.file_url}`,
                        }))}
                        showUploadList={{
                            showRemoveIcon: false, // Убираем иконку удаления
                            showDownloadIcon: true, // Можно оставить или убрать скачивание
                        }}
                    />
                }
            </Flex>
        </div>
    )
}