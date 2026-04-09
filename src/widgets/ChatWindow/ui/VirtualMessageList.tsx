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
import { FixedSizeList as List } from 'react-window';
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

const ITEM_HEIGHT = 173;

export const VirtualMessageList = forwardRef<VirtualMessageListRef, VirtualMessageListProps>(
    ({ messages, currentUserId, loading, onLoadMore, hasMore, loadingMore }, ref) => {
        const listRef = useRef<List>(null);
        const [containerHeight, setContainerHeight] = useState(0);
        const containerRef = useRef<HTMLDivElement>(null);
        const isAutoScrolling = useRef(false);

        // НЕ инвертируем массив - оставляем как есть (старые в начале, новые в конце)
        // messages[0] - самое старое, messages[messages.length-1] - самое новое

        // Прокрутка вниз (к последнему сообщению)
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

        // Автоматическая прокрутка при загрузке и новых сообщениях
        useEffect(() => {
            if (messages.length > 0 && !loading) {
                scrollToBottom();
            }
        }, [messages.length, loading, scrollToBottom]);

        // Отслеживаем высоту контейнера
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

        // Проверка скролла для подгрузки (скролл вверх)
        const handleScroll = useCallback(
            ({ scrollOffset }: { scrollOffset: number }) => {
                if (isAutoScrolling.current) return;

                // Если скроллим вверх (scrollOffset接近 0) - подгружаем старые сообщения
                if (scrollOffset < 100 && hasMore && !loadingMore && onLoadMore) {
                    onLoadMore();
                }
            },
            [hasMore, loadingMore, onLoadMore]
        );

        const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
            const message = messages[index];
            if (!message) return null;

            return (
                <div style={style}>
                    <Message data={message} fromYou={message.sender?.id === currentUserId} />
                </div>
            );
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
            <div ref={containerRef} style={{ height: '100%', position: 'relative' }}>
                {loadingMore && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            padding: '8px',
                            background: '#f0f0f0',
                            zIndex: 1,
                        }}
                    >
                        Загрузка истории...
                    </div>
                )}
                <List
                    ref={listRef}
                    height={containerHeight}
                    width="100%"
                    itemCount={messages.length}
                    itemSize={ITEM_HEIGHT}
                    onScroll={handleScroll}
                >
                    {Row}
                </List>
            </div>
        );
    }
);

VirtualMessageList.displayName = 'VirtualMessageList';
