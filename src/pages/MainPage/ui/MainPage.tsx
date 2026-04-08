import { Flex } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userAPI } from 'entities/user';
import { RootStateType } from 'app/store/store';
import { setCurrentUser } from 'app/store/slice/GeneralSlice';
import { LeftMenu } from 'widgets/LeftMenu/LeftMenu';
import { ChatWindow } from '../../../widgets/ChatWindow/ui/ChatWindow';

const MainPage = () => {
    const dispatch = useDispatch();
    const selectedConversationId = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );

    const { data: currentUserData } = userAPI.useGetCurrentQuery();

    useEffect(() => {
        if (currentUserData) {
            dispatch(setCurrentUser(currentUserData));
        }
    }, [currentUserData]);

    return (
        <Flex style={{ background: '#d8e3f4', height: '100vh', overflow: 'hidden' }}>
            <LeftMenu />
            {selectedConversationId ? (
                <ChatWindow />
            ) : (
                <Flex justify={'center'} align={'center'}></Flex>
            )}
        </Flex>
    );
};

export default MainPage;
