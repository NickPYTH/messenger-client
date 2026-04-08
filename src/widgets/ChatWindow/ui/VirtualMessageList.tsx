import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Empty, Flex } from 'antd';
import Message from './Message';
import { MessageModel } from 'entities/message';
import { VariableSizeList } from 'react-window';

interface VirtualMessageListProps {
    messages: MessageModel[];
    currentUserId?: number;
    loading?: boolean;
    onScrollToTop?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}

export interface VirtualMessageListRef {
    scrollToBottom: () => void;
    scrollToMessage: (messageId: number) => void;
}

const VirtualMessageList = forwardRef<VirtualMessageListRef, VirtualMessageListProps>(
    ({ messages, currentUserId, loading, onScrollToTop, hasMore, loadingMore }, ref) => {
        const listRef = useRef<VariableSizeList>(null);
        const itemHeights = useRef<Map<number, number>>(new Map());
        const isScrollingToBottom = useRef(false);
        const prevMessagesLength = useRef(messages.length);

        const getItemHeight = (index: number) => {
            return itemHeights.current.get(index) || 80;
        };

        const setItemHeight = (index: number, height: number) => {
            if (itemHeights.current.get(index) !== height) {
                itemHeights.current.set(index, height);
                listRef.current?.resetAfterIndex(index);
            }
        };

        const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
            const message = messages[index];
            const rowRef = useRef<HTMLDivElement>(null);

            useEffect(() => {
                if (rowRef.current) {
                    const height = rowRef.current.clientHeight;
                    setItemHeight(index, height);
                }
            }, [index, message]);

            if (!message) return null;

            return (
                <div style={style}>
                    <Flex
                        ref={rowRef}
                        style={{
                            justifyContent: message.sender?.id === currentUserId ? 'end' : 'start',
                        }}
                    >
                        <Message
                            key={message.id}
                            data={message}
                            fromYou={message.sender?.id === currentUserId}
                        />
                    </Flex>
                </div>
            );
        };

        const scrollToBottom = () => {
            if (listRef.current && messages.length > 0) {
                isScrollingToBottom.current = true;
                listRef.current.scrollToItem(messages.length - 1, 'end');
                setTimeout(() => {
                    isScrollingToBottom.current = false;
                }, 100);
            }
        };

        const scrollToMessage = (messageId: number) => {
            const index = messages.findIndex((m) => m.id === messageId);
            if (index !== -1 && listRef.current) {
                listRef.current.scrollToItem(index, 'center');
            }
        };

        useImperativeHandle(ref, () => ({
            scrollToBottom,
            scrollToMessage,
        }));

        useEffect(() => {
            if (messages.length > prevMessagesLength.current && !isScrollingToBottom.current) {
                scrollToBottom();
            }
            prevMessagesLength.current = messages.length;
        }, [messages.length]);

        const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
            if (scrollOffset === 0 && hasMore && !loadingMore && onScrollToTop) {
                onScrollToTop();
            }
        };

        if (loading && messages.length === 0) {
            return (
                <Flex justify="center" align="center" style={{ height: '100%' }}>
                    <div>Загрузка...</div>
                </Flex>
            );
        }

        if (messages.length === 0) {
            return (
                <Flex justify="center" align="center" style={{ height: '100%' }}>
                    <Empty description="Сообщений пока нет..." />
                </Flex>
            );
        }

        return (
            <div style={{ height: '100%', position: 'relative' }}>
                {loadingMore && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            padding: '8px',
                            zIndex: 1,
                        }}
                    >
                        Загрузка истории...
                    </div>
                )}
                <VariableSizeList
                    ref={listRef}
                    height={window.innerHeight}
                    width="100%"
                    itemCount={messages.length}
                    itemSize={getItemHeight}
                    onScroll={handleScroll}
                    style={{ overflowY: 'auto' }}
                >
                    {Row}
                </VariableSizeList>
            </div>
        );
    }
);

VirtualMessageList.displayName = 'VirtualMessageList';

export default VirtualMessageList;
