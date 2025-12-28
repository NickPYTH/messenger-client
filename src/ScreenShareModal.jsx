import React, { useState, useRef, useEffect } from 'react';
import {Flex, Modal} from "antd";

const WEBRTC_CONFIG = {
    iceServers: [
        {
            urls: [
                'turn:83.222.9.213:3478?transport=udp',
                'turn:83.222.9.213:3478?transport=tcp',
                'turns:83.222.9.213:5349?transport=tcp'
            ],
            username: 'testuser',
            credential: 'testpassword'
        }
    ],
    iceTransportPolicy: 'relay',
    iceCandidatePoolSize: 0,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
};

export const ScreenShareModal = ({visible, setVisible, sendInviteLinkHandler}) => {
    const wsRef = useRef(null);
    const [ws, setWs] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [sources, setSources] = useState([]);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Ожидание...');
    const peerConnectionRef = useRef(null);
    const localVideoRef = useRef(null);

    // Новые состояния для комнат
    const [roomName, setRoomName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [viewers, setViewers] = useState(0);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        wsRef.current = socket;

        socket.onopen = () => {
            console.log('✅ Подключились к сигнальному серверу');
            setWs(socket);
            setStatus('Готов к созданию комнаты');
        };

        socket.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Сообщение от сервера:', data.type);

                switch (data.type) {
                    case 'room-created':
                        setRoomId(data.roomId);
                        setStatus(`Комната "${data.roomName}" создана`);
                        break;

                    case 'viewer-joined':
                        setViewers(prev => prev + 1);
                        console.log(`👤 Новый зритель: ${data.viewerId}`);
                        break;

                    case 'answer':
                        if (peerConnectionRef.current) {
                            const answer = new RTCSessionDescription({
                                type: 'answer',
                                sdp: data.sdp
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

            // Пытаемся запустить видео
            video.play().catch(error => {
                console.log('Автозапуск видео заблокирован:', error.message);
                // Показываем кнопку для ручного запуска
                setError('Нажмите на видео для запуска');
            });
        }

        // Очистка при размонтировании
        return () => {
            if (video && video.srcObject) {
                video.srcObject = null;
            }
        };
    }, [localStream]); // Зависимость от localStream

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
                username: 'Ведущий', // Можно получать из профиля
                from: 'sender'
            };

            wsRef.current.send(JSON.stringify(roomData));
            setStatus('Создание комнаты...');
        } else {
            setError('Нет подключения к серверу');
        }
    };

    // Запуск трансляции после создания комнаты
    const startRoomSharing = async (sourceId) => {
        if (!roomId) {
            setError('Сначала создайте комнату');
            return;
        }

        setStatus('Начинаю захват экрана...');
        setError('');

        try {
            // Убедимся, что есть sourceId
            let finalSourceId = sourceId;
            if (!finalSourceId && sources.length > 0) {
                finalSourceId = sources[0].id;
            } else if (!finalSourceId) {
                // Получаем источники заново
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
                        minFrameRate: 5,
                        maxFrameRate: 30
                    }
                }
            };

            // Получаем поток
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // ВАЖНО: Проверяем, что поток получен
            if (!stream) {
                throw new Error('Поток не получен');
            }

            // Проверяем наличие видео трека
            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('В потоке нет видео трека');
            }

            console.log('✅ Поток получен:', {
                id: videoTrack.id,
                label: videoTrack.label,
                enabled: videoTrack.enabled,
                readyState: videoTrack.readyState,
                settings: videoTrack.getSettings()
            });

            // Обновляем состояние
            setLocalStream(stream);
            setIsSharing(true);
            setStatus('Трансляция активна');

            // Уведомляем о возобновлении трансляции
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'broadcast-resumed',
                    from: 'sender',
                    roomId: roomId,
                    message: 'Трансляция возобновлена'
                }));
            }

            // Даем React время обновить DOM
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

            // Исправлено: должно быть window.electronAPI (не window.electron)
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
            // Закрываем предыдущее соединение если есть
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            // Создаем новое соединение
            const pc = new RTCPeerConnection(WEBRTC_CONFIG);

            peerConnectionRef.current = pc;

            // Добавляем локальный поток
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Обработка ICE-кандидатов
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE кандидат отправителя:', event.candidate);
                    // Отправляем через WebSocket
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                            type: 'ice-candidate',
                            candidate: event.candidate,
                            from: 'sender'
                        }));
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

            // Создаем оффер ОДИН РАЗ
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
                offerToReceiveAudio: false
            });

            await pc.setLocalDescription(offer);

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'offer',
                    sdp: offer.sdp,
                    from: 'sender',
                    roomId: roomId, // Добавляем roomId
                    timestamp: Date.now()
                }));
                console.log('📤 Оффер отправлен в комнату', roomId);
            }
        } catch (error) {
            console.error('Ошибка создания оффера:', error);
        }
    };

    // Остановка трансляции и закрытие комнаты
    const stopSharing = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // НЕ отправляем leave-room при остановке трансляции
        // Вместо этого отправляем broadcast-paused
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'broadcast-paused',
                from: 'sender',
                roomId: roomId,
                message: 'Трансляция приостановлена'
            }));
        }

        setIsSharing(false);
        setViewers(0);
        setStatus('Трансляция приостановлена'); // Важно: не "остановлена"
    };

    const shareLinkHandler = () => {
        if (roomId) {
            sendInviteLinkHandler(`${window.location.origin}/receiver?room=${roomId}`);
        }
    }

    return (
        <Modal title={!roomId ? "Создание трансляции" : `Комната ${roomName}`}
               maskClosable={false}
               open={visible}
               onCancel={() => setVisible(false)}
               width={'90vw'}
               loading={false}
               footer={() => (<></>)}
        >
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
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
                                marginBottom: '10px'
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
                                fontSize: '16px'
                            }}
                        >
                            Создать комнату
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: '#d4edda',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <p><strong>ID комнаты:</strong> {roomId}</p>
                        <p><strong>Статус:</strong> {status}</p>

                        {!isSharing && (
                            <div style={{ marginTop: '20px' }}>
                                <button
                                    onClick={getSources}
                                    style={{
                                        marginRight: '10px',
                                        padding: '10px 15px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Выбрать экран
                                </button>

                                {sources.length > 0 && (
                                    <button
                                        onClick={() => startRoomSharing()}
                                        style={{
                                            padding: '10px 15px',
                                            backgroundColor: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Начать трансляцию
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Список источников */}
                    {sources.length > 0 && !isSharing && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4>Выберите источник:</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {sources.map((source) => (
                                    <button
                                        key={source.id}
                                        onClick={() => startRoomSharing(source.id)}
                                        style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            backgroundColor: 'white'
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
                            <h4>Трансляция активна</h4>
                            <Flex gap={'small'}>
                                <button
                                    onClick={stopSharing}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
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
                                        cursor: 'pointer'
                                    }}
                                >
                                    Поделиться в чате
                                </button>
                            </Flex>

                            {/* Превью экрана */}
                            <div style={{ marginTop: '20px' }}>
                                <h5>Превью:</h5>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    style={{
                                        width: '100%',
                                        maxWidth: '600px',
                                        border: '2px solid #007bff',
                                        borderRadius: '5px'
                                    }}
                                />
                            </div>
                        </Flex>
                    )}
                </div>
            )}

            {/* Отображение ошибок */}
            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '20px'
                }}>
                    {error}
                </div>
            )}

            {roomId &&
                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}>
                    <p>Ссылка для подключения:</p>
                    <code style={{
                        display: 'block',
                        padding: '10px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        wordBreak: 'break-all'
                    }}>
                        {window.location.origin}/receiver?room={roomId}
                    </code>
                </div>
            }
        </div>
        </Modal>
    );
};
