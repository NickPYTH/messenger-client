import {Flex} from 'antd';
import { LeftMenu } from './LeftMenu';
import { ChatWindow } from './ChatWindow';
import { useState } from 'react';

const MainPage = () => {

    // States
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    // -----

    return(
        <Flex style={{background: '#d8e3f4', height: '100vh', overflow: 'hidden'}}>
            <LeftMenu />
            {!selectedChatId && <ChatWindow />}
        </Flex>
    )
}

export default MainPage;