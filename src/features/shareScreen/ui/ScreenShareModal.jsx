import React, { useState, useRef, useEffect } from 'react';
import {Button, Flex, Modal} from 'antd';
import { MinusOutlined } from '@ant-design/icons';

const WEBRTC_CONFIG = {
    iceServers: [
        {
            urls: [
                'turn:10.47.0.221:3478?transport=udp',
                'turn:10.47.0.221:3478?transport=tcp',
            ],
            username: 'test',
            credential: 'test',
        },
    ],
    iceTransportPolicy: 'relay',
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
};

// eslint-disable-next-line react/prop-types
export const ScreenShareModal = ({ visible, setVisible, sendInviteLinkHandler }) => {
    const wsRef = useRef(null);
    const [localStream, setLocalStream] = useState(null);
    const [sources, setSources] = useState([]);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Ожидание...');
    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const peerConnectionRef = useRef(null);
    const localVideoRef = useRef(null);
    const newWatcher = useRef(null);
    const minimizedVideoRef = useRef(null);

    const stopBtn = useRef(null);

    // Новые состояния для комнат
    const [roomName, setRoomName] = useState('Моя трансляция');
    const [roomId, setRoomId] = useState('');
    const [viewers, setViewers] = useState(0);
    const [isSharing, setIsSharing] = useState(false);

    // Состояние для свернутого режима
    const [isMinimized, setIsMinimized] = useState(false);

    // Состояние для позиции свернутого окна
    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 300 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Ссылки для свернутого окна
    const minimizedWindowRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket('wss://test-vapp-03.sgp.ru/signalserver/');

        wsRef.current = socket;

        socket.onopen = () => {
            console.log('✅ Подключились к сигнальному серверу');
            setStatus('Готов к созданию комнаты');
            createRoom();
        };

        socket.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Сообщение от сервера:', data.type);

                switch (data.type) {
                    case 'room-created':
                        setRoomId(data.roomId);
                        localStorage.setItem("roomId", data.roomId);
                        setStatus(`Комната создана`);
                        break;

                    case 'viewer-joined':
                        setViewers((prev) => prev + 1);
                        console.log(`Новый зритель: ${data.viewerId}`);
                        stopSharing();
                        newWatcher.current = data.viewerId;
                        setTimeout(() => startRoomSharing(localStorage.getItem("sourceId")), 1000);
                        break;

                    case 'answer':
                        if (peerConnectionRef.current) {
                            const answer = new RTCSessionDescription({
                                type: 'answer',
                                sdp: data.sdp,
                            });
                            await peerConnectionRef.current.setRemoteDescription(answer);
                            console.log('✅ Ответ установлен');
                        }
                        break;

                    case 'ice-candidate':
                        if (peerConnectionRef.current) {
                            await peerConnectionRef.current.addIceCandidate(
                                new RTCIceCandidate(data.candidate)
                            );
                            console.log('✅ ICE кандидат добавлен');
                        }
                        break;

                    case 'error':
                        setError(data.message);
                        break;

                    default:
                        console.log('Другое сообщение:', data.type);
                }
            } catch (error) {
                console.error('Ошибка обработки сообщения:', error);
            }
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    // Добавьте после объявления useRef
    useEffect(() => {
        const video = localVideoRef.current;
        if (video && localStream) {
            console.log('🎬 Назначаю поток на видео элемент');
            video.srcObject = localStream;
            video.muted = true;

            video.play().catch((error) => {
                console.log('Автозапуск видео заблокирован:', error.message);
                setError('Нажмите на видео для запуска');
            });
        }

        return () => {
            if (video && video.srcObject) {
                video.srcObject = null;
            }
        };
    }, [localStream]);

    // Эффект для мини-видео в свернутом режиме
    useEffect(() => {
        const video = minimizedVideoRef.current;
        if (video && localStream && isMinimized) {
            video.srcObject = localStream;
            video.muted = true;
            video.play().catch(console.error);
        }
    }, [localStream, isMinimized]);

    // Создание комнаты
    const createRoom = () => {
        if (!roomName.trim()) {
            setError('Введите название комнаты');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const roomData = {
                type: 'create-room',
                roomName: roomName,
                username: 'Ведущий',
                from: 'sender',
            };

            wsRef.current.send(JSON.stringify(roomData));
            setStatus('Создание комнаты...');
        } else {
            setError('Нет подключения к серверу');
        }
    };

    // Запуск трансляции после создания комнаты
    const startRoomSharing = async (sourceId) => {
        if (!roomId && !localStorage.getItem("roomId")) {
            setError('Сначала создайте комнату');
            return;
        }

        setStatus('Начинаю захват экрана...');
        setError('');

        try {
            let finalSourceId = sourceId;
            if (!finalSourceId && sources.length > 0) {
                finalSourceId = sources[0].id;
            } else if (!finalSourceId) {
                const srcs = await getSources();
                if (srcs.length === 0) {
                    setError('Нет доступных источников экрана');
                    return;
                }
                finalSourceId = srcs[0].id;
            }

            console.log('🔄 Захватываю источник:', finalSourceId);

            const constraints = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: finalSourceId,
                        minFrameRate: 10,
                        maxFrameRate: 60,
                    },
                },
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (!stream) {
                throw new Error('Поток не получен');
            }

            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('В потоке нет видео трека');
            }

            console.log('✅ Поток получен:', {
                id: videoTrack.id,
                label: videoTrack.label,
                enabled: videoTrack.enabled,
                readyState: videoTrack.readyState,
                settings: videoTrack.getSettings(),
            });

            setLocalStream(stream);
            setIsSharing(true);
            setStatus('Трансляция активна');

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'broadcast-resumed',
                        from: 'sender',
                        roomId: roomId ? roomId : localStorage.getItem("roomId"),
                        message: 'Трансляция возобновлена',
                    })
                );
            }

            setTimeout(() => {
                createPeerConnection(stream);
            }, 100);
        } catch (error) {
            console.error('❌ Ошибка захвата:', error);
            setError(`Ошибка захвата: ${error.message}`);
            setStatus('Ошибка');
        }
    };

    const getSources = async () => {
        try {
            setStatus('Получение источников...');

            if (window.electronAPI?.getDesktopSources) {
                const sources = await window.electronAPI.getDesktopSources();
                console.log('Получены источники:', sources);
                setSources(sources);
                setStatus(`Найдено ${sources.length} источников`);
                setError('');
                return sources;
            } else {
                setError('Electron API не доступен. Запустите через Electron.');
                setStatus('Ошибка');
                return [];
            }
        } catch (err) {
            console.error('Ошибка получения источников:', err);
            setError(`Ошибка: ${err.message}`);
            setStatus('Ошибка');
            return [];
        }
    };

    // Создание WebRTC соединения
    const createPeerConnection = (stream) => {
        try {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            const pc = new RTCPeerConnection(WEBRTC_CONFIG);

            peerConnectionRef.current = pc;

            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE кандидат отправителя:', event.candidate);
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(
                            JSON.stringify({
                                type: 'ice-candidate',
                                candidate: event.candidate,
                                from: 'sender',
                            })
                        );
                    }
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log('Состояние ICE (отправитель):', pc.iceConnectionState);
                setStatus(`ICE: ${pc.iceConnectionState}`);
            };

            pc.onsignalingstatechange = () => {
                console.log('Сигнальное состояние:', pc.signalingState);
            };

            createAndSendOffer(pc);
        } catch (error) {
            console.error('Ошибка создания PeerConnection:', error);
            setError(`Ошибка соединения: ${error.message}`);
        }
    };

    const createAndSendOffer = async (pc) => {
        try {
            const offer = await pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false,
            });

            await pc.setLocalDescription(offer);

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'offer',
                        sdp: offer.sdp,
                        from: 'sender',
                        roomId: roomId,
                        timestamp: Date.now(),
                    })
                );
                console.log('📤 Оффер отправлен в комнату', roomId);
            }
        } catch (error) {
            console.error('Ошибка создания оффера:', error);
        }
    };

    // Остановка трансляции
    const stopSharing = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'broadcast-paused',
                    from: 'sender',
                    roomId: roomId,
                    message: 'Приостановлена',
                })
            );
        }

        setIsSharing(false);
        setViewers(0);
        setStatus('Приостановлена');
    };

    const shareLinkHandler = () => {
        if (roomId) {
            sendInviteLinkHandler(`${window.location.origin}/messenger/?room=${roomId}`);
        }
    };

    // Функция для сворачивания/разворачивания
    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        // Сбрасываем позицию при разворачивании
        if (!isMinimized) {
            setPosition({ x: window.innerWidth - 340, y: window.innerHeight - 300 });
        }
    };

    // Обработчики для перетаскивания
    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        e.preventDefault();

        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;

        // Ограничиваем перетаскивание в пределах окна
        const maxX = window.innerWidth - (minimizedWindowRef.current?.offsetWidth || 300);
        const maxY = window.innerHeight - (minimizedWindowRef.current?.offsetHeight || 300);

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Добавляем и удаляем глобальные обработчики
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        } else {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging]);

    // Закрытие модалки
    const handleClose = () => {
        stopSharing();
        setVisible(false);
        setIsMinimized(false);
    };

    return (
        <>
            {/* Свернутое окно - отдельный элемент вне Modal */}
            {isMinimized && visible && (
                <div
                    ref={minimizedWindowRef}
                    style={{
                        position: 'fixed',
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: '300px',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1050,
                        border: '1px solid #d9d9d9',
                        pointerEvents: 'auto',
                        cursor: isDragging ? 'grabbing' : 'default',
                        transition: isDragging ? 'none' : 'box-shadow 0.2s',
                    }}
                >
                    {/* Заголовок для перетаскивания */}
                    <div
                        onMouseDown={handleDragStart}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: '#f0f2f5',
                            borderRadius: '8px 8px 0 0',
                            borderBottom: '1px solid #d9d9d9',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 500 }}>
                                {roomName}
                            </span>
                            <span style={{
                                fontSize: '12px',
                                color: isSharing ? '#52c41a' : '#faad14',
                                backgroundColor: isSharing ? '#f6ffed' : '#fff7e6',
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                                {isSharing ? 'В эфире' : 'Пауза'}
                            </span>
                        </div>
                        <Flex gap="small">
                            {/*<Button*/}
                            {/*    type="text"*/}
                            {/*    size="small"*/}
                            {/*    onClick={() => {*/}
                            {/*        if (isSharing) {*/}
                            {/*            stopSharing();*/}
                            {/*        } else {*/}
                            {/*            getSources();*/}
                            {/*        }*/}
                            {/*    }}*/}
                            {/*    style={{ cursor: 'pointer' }}*/}
                            {/*>*/}
                            {/*    {isSharing ? '⏹' : '▶'}*/}
                            {/*</Button>*/}
                            <Button
                                type="text"
                                size="small"
                                icon={<MinusOutlined />}
                                onClick={toggleMinimize}
                                style={{ cursor: 'pointer' }}
                            />
                            <Button
                                type="text"
                                size="small"
                                danger
                                onClick={handleClose}
                                style={{ cursor: 'pointer' }}
                            >
                                ✕
                            </Button>
                        </Flex>
                    </div>

                    {/* Мини-превью экрана */}
                    <div style={{ padding: '12px' }}>
                        <video
                            ref={minimizedVideoRef}
                            autoPlay
                            muted
                            style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                backgroundColor: '#000',
                            }}
                        />

                        {/* Краткая информация */}
                        <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#666',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <span>ID: {roomId?.slice(-4)}</span>
                        </div>

                        {/* Кнопка разворачивания */}
                        <Button
                            type="link"
                            size="small"
                            onClick={toggleMinimize}
                            style={{ width: '100%', marginTop: '8px' }}
                        >
                            Развернуть окно трансляции
                        </Button>
                    </div>
                </div>
            )}

            {/* Полноценное модальное окно (только когда не свернуто) */}
            <Modal
                title={
                    <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                        <span>{roomName}</span>
                        <Flex gap="small">
                            <Button
                                style={{marginRight: 20}}
                                type="text"
                                icon={<MinusOutlined />}
                                onClick={toggleMinimize}
                                size="small"
                                title="Свернуть"
                            />
                        </Flex>
                    </Flex>
                }
                maskClosable={false}
                open={visible && !isMinimized}
                onCancel={handleClose}
                width={800}
                loading={false}
                footer={() => <></>}
                destroyOnClose
            >
                <div>
                    {/* Создание комнаты */}
                    {!roomId ? (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    placeholder="Название комнаты"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: '16px',
                                        marginBottom: '10px',
                                    }}
                                />
                                <button
                                    onClick={createRoom}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                    }}
                                >
                                    Создать комнату
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '10px' }}>
                            <Flex style={{width: '100%'}} justify={'space-between'}>
                                <Flex vertical style={{width: '30%', height: 138}}>
                                    <div
                                        style={{
                                            backgroundColor: '#d8dcfc',
                                            padding: '5px',
                                            borderRadius: '8px',
                                            marginBottom: '10px',
                                            height: '100%'
                                        }}
                                    >
                                        <p>
                                            <strong>ID комнаты:</strong> {roomId}
                                        </p>
                                        <p>
                                            <strong>Статус:</strong> {status}
                                        </p>

                                        {!isSharing && (
                                            <div style={{ marginTop: '20px' }}>
                                                <Button onClick={getSources}>
                                                    Выбрать окно
                                                </Button>
                                            </div>
                                        )}

                                    </div>
                                </Flex>
                                <Flex vertical style={{width: '68%', height: 136}}>
                                    {roomId && (
                                        <div
                                            style={{
                                                padding: '15px',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                height: '100%'
                                            }}
                                        >
                                            <p>Ссылка для подключения:</p>
                                            <code
                                                style={{
                                                    display: 'block',
                                                    padding: '10px',
                                                    backgroundColor: '#e9ecef',
                                                    borderRadius: '4px',
                                                    marginBottom: '10px',
                                                    wordBreak: 'break-all',
                                                }}
                                            >
                                                {window.location.origin}/messenger/?room={roomId}
                                            </code>
                                        </div>
                                    )}
                                </Flex>
                            </Flex>

                            {/* Список источников */}
                            {sources.length > 0 && !isSharing && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h4>Выберите источник:</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {sources.map((source) => (
                                            <button
                                                key={source.id}
                                                onClick={() => {
                                                    startRoomSharing(source.id);
                                                    setSelectedSourceId(source.id);
                                                    localStorage.setItem("sourceId", source.id)
                                                }}
                                                style={{
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'white',
                                                }}
                                            >
                                                {source.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Управление трансляцией */}
                            {isSharing && (
                                <Flex gap={'small'} vertical>
                                    <Flex gap={'small'}>
                                        <button
                                            ref={stopBtn}
                                            onClick={stopSharing}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                width: '30%'
                                            }}
                                        >
                                            Остановить трансляцию
                                        </button>
                                        <button
                                            onClick={shareLinkHandler}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#17a2b8',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Поделиться в чате
                                        </button>
                                    </Flex>
                                    {/* Превью экрана */}
                                    <div>
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            muted
                                            style={{
                                                width: '100%',
                                                maxWidth: '600px',
                                                border: '2px solid #007bff',
                                                borderRadius: '5px',
                                            }}
                                        />
                                    </div>
                                </Flex>
                            )}
                        </div>
                    )}

                    {/* Отображение ошибок */}
                    {error && (
                        <div
                            style={{
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                padding: '10px',
                                borderRadius: '4px',
                                marginTop: '20px',
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};