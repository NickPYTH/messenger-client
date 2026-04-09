// widgets/ChatWindow/ui/VirtualMessageList.tsx
import React, {
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useState,
    useCallback,
} from 'react';
import { Empty, Flex } from 'antd';
import { VariableSizeList as List } from 'react-window';
import Message from './Message';
import { MessageModel } from 'entities/message';

interface VirtualMessageListProps {
    messages: MessageModel[];
    currentUserId?: number;
    loading?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}

export interface VirtualMessageListRef {
    scrollToBottom: () => void;
}

export const VirtualMessageList = forwardRef<VirtualMessageListRef, VirtualMessageListProps>(
    ({ messages, currentUserId, loading, onLoadMore, hasMore, loadingMore }, ref) => {
        const listRef = useRef<List>(null);
        const [containerHeight, setContainerHeight] = useState(0);
        const containerRef = useRef<HTMLDivElement>(null);
        const isAutoScrolling = useRef(false);

        // Хранилище высот каждого сообщения
        const heightsRef = useRef<Map<number, number>>(new Map());

        // Функция получения высоты сообщения
        const getItemHeight = useCallback((index: number) => {
            return heightsRef.current.get(index) || 80; // высота по умолчанию 80px
        }, []);

        const setItemHeight = useCallback((index: number, height: number) => {
            const currentHeight = heightsRef.current.get(index);
            if (currentHeight !== height) {
                heightsRef.current.set(index, height);
                listRef.current?.resetAfterIndex(index);
            }
        }, []);

        const scrollToBottom = useCallback(() => {
            if (listRef.current && messages.length > 0) {
                isAutoScrolling.current = true;
                const lastIndex = messages.length - 1;
                listRef.current.scrollToItem(lastIndex, 'end');
                setTimeout(() => {
                    isAutoScrolling.current = false;
                }, 100);
            }
        }, [messages.length]);

        useImperativeHandle(ref, () => ({
            scrollToBottom,
        }));

        const Row = useCallback(
            ({ index, style }: { index: number; style: React.CSSProperties }) => {
                const message = messages[index];
                const rowRef = useRef<HTMLDivElement>(null);

                // Измеряем высоту после рендера
                useEffect(() => {
                    if (rowRef.current) {
                        const height = rowRef.current.clientHeight;
                        setItemHeight(index, height);
                    }
                }, [index, setItemHeight, message]);

                if (!message) return null;

                return (
                    <div style={style}>
                        <Flex
                            justify={message.sender?.id == currentUserId ? 'start' : 'end'}
                            ref={rowRef}
                        >
                            <Message
                                data={message}
                                fromYou={message.sender?.id === currentUserId}
                            />
                        </Flex>
                    </div>
                );
            },
            [messages, currentUserId, setItemHeight]
        );

        useEffect(() => {
            if (messages.length > 0 && !loading) {
                // Небольшая задержка для расчёта высоты
                setTimeout(() => {
                    scrollToBottom();
                }, 50);
            }
        }, [messages.length, loading, scrollToBottom]);

        useEffect(() => {
            heightsRef.current.clear();
            if (listRef.current) {
                listRef.current.resetAfterIndex(0);
            }
        }, [messages]);

        useEffect(() => {
            const updateHeight = () => {
                if (containerRef.current) {
                    setContainerHeight(containerRef.current.clientHeight);
                }
            };

            updateHeight();
            window.addEventListener('resize', updateHeight);

            const observer = new ResizeObserver(updateHeight);
            if (containerRef.current) {
                observer.observe(containerRef.current);
            }

            return () => {
                window.removeEventListener('resize', updateHeight);
                observer.disconnect();
            };
        }, []);

        const handleScroll = useCallback(
            ({ scrollOffset }: { scrollOffset: number }) => {
                if (isAutoScrolling.current) return;

                if (scrollOffset < 100 && hasMore && !loadingMore && onLoadMore) {
                    onLoadMore();
                }
            },
            [hasMore, loadingMore, onLoadMore]
        );

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
            <div
                ref={containerRef}
                style={{
                    height: '100%',
                    position: 'relative',
                }}
            >
                <List
                    style={{ overflowX: 'hidden' }}
                    ref={listRef}
                    height={containerHeight}
                    width={'100%'}
                    itemCount={messages.length}
                    itemSize={getItemHeight}
                    onScroll={handleScroll}
                >
                    {Row}
                </List>
            </div>
        );
    }
);

VirtualMessageList.displayName = 'VirtualMessageList';
