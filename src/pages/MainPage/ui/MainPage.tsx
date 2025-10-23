import {Flex} from 'antd';
import { LeftMenu } from './LeftMenu';
import { ChatWindow } from './ChatWindow';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    electronAPI: {
      executeCommand: (command: string) => Promise<string>;
    };
  }
}

const MainPage = () => {

    // States
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    // -----


    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.executeCommand('echo "Приложение запущено!"')
            .then(result => alert('Команда выполнена:' + result))
            .catch(error => alert('Ошибка:' + error));
    }
    }, []);

    return(
        <Flex style={{background: '#d8e3f4', height: '100vh', overflow: 'hidden'}}>
            <LeftMenu />
            {!selectedChatId && <ChatWindow />}
        </Flex>
    )
}

export default MainPage;