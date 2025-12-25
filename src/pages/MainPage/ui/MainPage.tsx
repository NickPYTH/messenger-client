// MainPage.tsx (ваш текущий файл УПРОЩЕННЫЙ)
import {Flex} from 'antd';
import {LeftMenu} from './LeftMenu/LeftMenu';
import {ChatWindow} from './ChatWindow/ChatWindow';
import {useEffect} from 'react';
import {userAPI} from "../../../service/UserService";
import {useDispatch, useSelector} from "react-redux";
import {setCurrentUser} from "../../../store/slice/GeneralSlice";
import {RootStateType} from '../../../store/store';
import {useWebSocket} from "../../../app/WebSocketProvider/ui/WebSocketProvider";

const MainPage = () => {
    const dispatch = useDispatch();
    const selectedConversationId = useSelector((state: RootStateType) => state.currentUser.selectedConversationId);

    const { isConnected, registerHandler, sendMessage } = useWebSocket();
    const { data: currentUserData } = userAPI.useGetCurrentQuery();

    useEffect(() => {
        if (currentUserData) {
            dispatch(setCurrentUser(currentUserData));
        }
    }, [currentUserData]);

    return (
        <Flex style={{ background: '#d8e3f4', height: '100vh', overflow: 'hidden' }}>
            <LeftMenu />
            {selectedConversationId ?
                <ChatWindow />
                :
                <Flex justify={'center'} align={'center'} style={{width: '100%'}}>
                    Выберите, кому хотели бы написать
                </Flex>
            }

            {/*<div style={{*/}
            {/*    position: 'fixed',*/}
            {/*    bottom: 10,*/}
            {/*    right: 10,*/}
            {/*    padding: '5px 10px',*/}
            {/*    background: isConnected ? 'green' : 'red',*/}
            {/*    color: 'white',*/}
            {/*    borderRadius: '5px'*/}
            {/*}}>*/}
            {/*    {isConnected ? 'Online' : 'Offline'}*/}
            {/*</div>*/}
        </Flex>
    );
};

export default MainPage;