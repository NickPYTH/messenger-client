import { useState, useEffect } from 'react';
import { ConversationMemberModel, conversationsAPI } from 'entities/conversation';

const VIRTUAL_HELPER_IDS = [21716, 21717];

const useVirtualHelper = (conversationId?: number) => {
    const [isVirtualHelper, setIsVirtualHelper] = useState(false);
    const [getConversation, { data: conversation }] = conversationsAPI.useGetMutation();
    const [dropContext, { isSuccess: isSuccessDropContext }] =
        conversationsAPI.useDropContextMutation();

    useEffect(() => {
        if (conversationId) {
            getConversation(conversationId);
        }
    }, [conversationId, getConversation]);

    useEffect(() => {
        if (conversation) {
            const isMember = conversation.members?.some((cm: ConversationMemberModel) =>
                VIRTUAL_HELPER_IDS.includes(cm.user.id)
            );
            setIsVirtualHelper(!!isMember);
        }
    }, [conversation]);

    // Автообновление для виртуального помощника
    useEffect(() => {
        if (!isVirtualHelper || !conversationId) return;

        const intervalId = setInterval(() => {
            getConversation(conversationId);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [isVirtualHelper, conversationId, getConversation]);

    const dropContextHandler = () => {
        if (conversationId) {
            dropContext(conversationId);
        }
    };

    return {
        isVirtualHelper,
        dropContext: dropContextHandler,
        isContextDropped: isSuccessDropContext,
    };
};

export default useVirtualHelper;
