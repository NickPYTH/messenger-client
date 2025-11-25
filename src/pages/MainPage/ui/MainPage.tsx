import {Flex} from 'antd';
import {LeftMenu} from './LeftMenu/LeftMenu';
import {ChatWindow} from './ChatWindow/ChatWindow';
import {useEffect, useState} from 'react';
import {userAPI} from "../../../service/UserService";
import {useDispatch} from "react-redux";
import {setCurrentUser} from "../../../store/slice/UserSlice";

declare global {
  interface Window {
    electronAPI: {
      executeCommand: (command: string) => Promise<string>;
    };
  }
}

const MainPage = () => {

    // Store
    const dispatch = useDispatch();
    // -----

    // States
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    // -----

    // Web requests
    const {
        data: currentUserData,
        isLoading: isCurrentUserLoading,
        error: currentUserError,
        refetch: refetchCurrentUser // если нужно перезапросить данные
    } = userAPI.useGetCurrentQuery();
    // -----

    // Effects
    useEffect(() => {
        if (currentUserData) {
            dispatch(setCurrentUser(currentUserData))
        }
    }, [currentUserData]);

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
            {selectedChatId && <ChatWindow />}
        </Flex>
    )
}

export default MainPage;