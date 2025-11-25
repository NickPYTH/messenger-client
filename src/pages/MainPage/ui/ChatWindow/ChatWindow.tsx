import { Flex, Input } from "antd"
import { Message } from "./Message";

const {Search} = Input;

export const ChatWindow = () => {
    return(
        <Flex style={{
            display: 'grid',
            gridTemplateRows: '1fr auto', // Сообщения занимают всё пространство, инпут - по содержимому
            height: '100vh',
            padding: 5,
            width: '95%',
            overflow: 'hidden'
        }}>
            {/* Сообщения */}
            <Flex
            vertical
             style={{
                overflowY: 'auto',
                padding: '10px 0'
            }}>
                {[
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    { fromYou: true, text: "Some message from you" },
                    { fromYou: false, text: "Some message from your friend" },
                    // ... остальные сообщения
                ].map((message, index) => (
                    <Message 
                        key={index}
                        text={message.text} 
                        fromYou={message.fromYou}
                    />
                ))}
            </Flex>
            
            {/* Инпут */}
            <div style={{
                height: 50,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Search
                    style={{ maxWidth: 600, width: '100%' }}
                    placeholder="Введите сообщение"
                    allowClear
                    enterButton="Отправить"
                />
            </div>
        </Flex>
    )
}