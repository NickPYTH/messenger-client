// Receiver.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const WEBRTC_CONFIG = {
    iceServers: [
        {
            urls: [
                'turn:83.222.9.213:3478?transport=udp',
                'turn:83.222.9.213:3478?transport=tcp',
                'turns:83.222.9.213:5349?transport=tcp',
            ],
            username: 'testuser',
            credential: 'testpassword',
        },
    ],
    iceTransportPolicy: 'relay',
    iceCandidatePoolSize: 0,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
};

const Receiver = () => {
    const [searchParams] = useSearchParams();
    const roomIdFromUrl = searchParams.get('room');

    const [connectionStatus, setConnectionStatus] = useState('Ожидание...');
    const [remoteStream, setRemoteStream] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(roomIdFromUrl || '');
    const [roomInfo, setRoomInfo] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [signalingConnected, setSignalingConnected] = useState(false); // Добавлено

    const peerConnectionRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const signalingSocketRef = useRef(null);
    const reconnectAttemptRef = useRef(0);

    useEffect(() => {
        connectToSignalingServer();
        console.log('lel', roomIdFromUrl);
        setTimeout(() => joinRoom(roomIdFromUrl), 100);
        return () => {
            cleanup();
        };
    }, []);

    // При изменении комнаты из URL
    useEffect(() => {
        if (roomIdFromUrl) {
            setSelectedRoom(roomIdFromUrl);
        }
    }, [roomIdFromUrl]);

    useEffect(() => {
        const video = remoteVideoRef.current;
        if (video && remoteStream) {
            console.log('🎬 Обновляю видео элемент с потоком');
            video.srcObject = remoteStream;
            video.muted = true;

            // Пытаемся запустить
            video.play().catch((error) => {
                console.log('Автозапуск видео:', error.message);
            });
        }

        return () => {
            if (video && video.srcObject) {
                video.srcObject = null;
            }
        };
    }, [remoteStream]);

    const connectToSignalingServer = () => {
        try {
            if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
                console.log('✅ WebSocket уже подключен');
                return;
            }

            const wsUrl = 'ws://localhost:8080';
            console.log(`🔗 Подключаюсь к сигнальному серверу: ${wsUrl}`);

            const ws = new WebSocket(wsUrl);
            signalingSocketRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Подключение к сигнальному серверу установлено');
                setSignalingConnected(true);
                setConnectionStatus('Подключено к серверу');
                reconnectAttemptRef.current = 0;
                requestRoomList();
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 Получено сообщение:', data.type, 'от:', data.from);

                    switch (data.type) {
                        case 'broadcast-paused':
                            console.log(`⏸️ Трансляция приостановлена: ${data.message}`);
                            setConnectionStatus(`Трансляция приостановлена: ${data.message}`);
                            // Можно очистить поток или показать сообщение
                            if (remoteStream) {
                                remoteStream.getTracks().forEach((track) => track.stop());
                                setRemoteStream(null);
                            }
                            break;

                        case 'broadcast-resumed':
                            console.log(`▶️ Трансляция возобновлена: ${data.message}`);
                            setConnectionStatus(`Трансляция возобновлена...`);
                            // PeerConnection уже создан, ждем новый оффер
                            break;
                        case 'room-list':
                        case 'room-list-update':
                            setAvailableRooms(data.rooms);
                            console.log(`📊 Получен список комнат: ${data.rooms?.length || 0} шт.`);
                            break;

                        case 'room-joined':
                            console.log(
                                `✅ Присоединились к комнате: ${data.roomName} (${data.roomId})`
                            );
                            setRoomInfo({
                                id: data.roomId,
                                name: data.roomName,
                                sender: data.sender,
                            });
                            setConnectionStatus(`Подключен к комнате "${data.roomName}"`);
                            setIsConnecting(false);

                            // Создаем PeerConnection сразу после присоединения
                            initializePeerConnection();
                            break;

                        case 'broadcast-ended':
                            console.log('🏁 Трансляция завершена');
                            setConnectionStatus('Трансляция завершена');
                            setRemoteStream(null);
                            setRoomInfo(null);
                            cleanup();
                            break;

                        case 'offer':
                            console.log('📥 Получен SDP оффер от отправителя');
                            await handleOffer(data.sdp, data.roomId);
                            break;

                        case 'ice-candidate':
                            console.log('🧊 Получен ICE кандидат от отправителя');
                            await handleIceCandidate(data.candidate);
                            break;

                        case 'error':
                            console.error('❌ Ошибка от сервера:', data.message);
                            setConnectionStatus(`Ошибка: ${data.message}`);
                            setIsConnecting(false);
                            break;

                        default:
                            console.log('📭 Неизвестный тип сообщения:', data.type);
                    }
                } catch (error) {
                    console.error('❌ Ошибка обработки сообщения:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket соединение закрыто:', event.code, event.reason);
                setSignalingConnected(false);
                setConnectionStatus('Соединение разорвано');

                // Пытаемся переподключиться
                if (reconnectAttemptRef.current < 5) {
                    reconnectAttemptRef.current += 1;
                    const delay = Math.min(1000 * reconnectAttemptRef.current, 5000);
                    console.log(
                        `🔄 Переподключение через ${delay}мс (попытка ${reconnectAttemptRef.current})`
                    );

                    setTimeout(() => {
                        connectToSignalingServer();
                    }, delay);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket ошибка:', error);
                setConnectionStatus('Ошибка подключения');
            };
        } catch (error) {
            console.error('❌ Ошибка подключения к сигнальному серверу:', error);
            setConnectionStatus('Ошибка подключения');
        }
    };

    const requestRoomList = () => {
        if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
            signalingSocketRef.current.send(
                JSON.stringify({
                    type: 'list-rooms',
                    from: 'receiver',
                })
            );
        }
    };

    const joinRoom = (roomId) => {
        if (!roomId || isConnecting) return;

        setIsConnecting(true);
        setConnectionStatus('Подключение к комнате...');

        if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
            signalingSocketRef.current.send(
                JSON.stringify({
                    type: 'join-room',
                    roomId: roomId,
                    username: 'Зритель', // Можно получать из профиля
                    from: 'receiver',
                })
            );
            setSelectedRoom(roomId);
        }
    };

    const handleOffer = async (sdpOffer, roomId) => {
        if (!peerConnectionRef.current) {
            console.error('❌ PeerConnection не инициализирован');
            initializePeerConnection();
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('❌ PeerConnection не создан');
            return;
        }

        try {
            console.log('🔄 Устанавливаю удаленное описание (offer)...');

            await pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: sdpOffer })
            );
            console.log('✅ Удаленное описание установлено');

            console.log('🔄 Создаю ответ (answer)...');
            const answer = await pc.createAnswer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false,
            });

            await pc.setLocalDescription(answer);
            console.log('✅ Ответ создан и установлен локально');

            // Отправляем ответ
            if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
                signalingSocketRef.current.send(
                    JSON.stringify({
                        type: 'answer',
                        sdp: answer.sdp,
                        from: 'receiver',
                        roomId: roomId || roomInfo?.id,
                        timestamp: Date.now(),
                    })
                );
                console.log('📤 Ответ отправлен отправителю');
            } else {
                console.error('❌ WebSocket не подключен');
            }
        } catch (error) {
            console.error('❌ Ошибка обработки оффера:', error);
            console.error('Детали ошибки:', error.message);

            // Пересоздаем соединение при ошибке
            if (error.message.includes('subsequent offer') || error.message.includes('m-lines')) {
                console.log('🔄 Ошибка SDP. Пересоздаю PeerConnection...');
                initializePeerConnection();

                // Пробуем снова через секунду
                setTimeout(() => {
                    if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
                        signalingSocketRef.current.send(
                            JSON.stringify({
                                type: 'request-offer',
                                from: 'receiver',
                                roomId: roomId || roomInfo?.id,
                            })
                        );
                    }
                }, 1000);
            }
        }
    };

    const initializePeerConnection = () => {
        try {
            // Закрываем предыдущее соединение если есть
            if (peerConnectionRef.current) {
                console.log('🧹 Закрываю предыдущий PeerConnection');
                peerConnectionRef.current.close();
            }

            console.log('🔄 Инициализирую PeerConnection с конфигом:', WEBRTC_CONFIG);
            const pc = new RTCPeerConnection(WEBRTC_CONFIG);
            peerConnectionRef.current = pc;

            // Обработка входящего потока
            pc.ontrack = (event) => {
                console.log('🎬 Получен трек от отправителя:', event.track.kind);

                if (event.streams && event.streams[0]) {
                    const stream = event.streams[0];
                    console.log('📹 Поток получен, треков:', stream.getTracks().length);

                    // Проверяем видео трек
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        console.log('📷 Видео трек:', {
                            enabled: videoTrack.enabled,
                            readyState: videoTrack.readyState,
                            settings: videoTrack.getSettings(),
                        });
                    }

                    setRemoteStream(stream);
                    setConnectionStatus('Получен видеопоток');

                    // Обновляем видео элемент
                    setTimeout(() => {
                        if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                            console.log('🎬 Назначаю поток на видео элемент');
                            remoteVideoRef.current.srcObject = stream;
                            remoteVideoRef.current.muted = true;

                            remoteVideoRef.current.play().catch((error) => {
                                console.log('⚠️ Автозапуск заблокирован:', error.message);
                                // Показываем сообщение пользователю
                                setConnectionStatus('Кликните по видео для запуска');
                            });
                        }
                    }, 100);
                }
            };

            // ICE кандидаты
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 Локальный ICE кандидат:', event.candidate.type);

                    if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
                        signalingSocketRef.current.send(
                            JSON.stringify({
                                type: 'ice-candidate',
                                candidate: event.candidate,
                                from: 'receiver',
                                roomId: roomInfo?.id,
                            })
                        );
                    }
                } else {
                    console.log('✅ Все ICE кандидаты собраны');
                }
            };

            // Отслеживание состояния
            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                console.log('🔌 ICE состояние:', state);
                setConnectionStatus(`ICE: ${state}`);

                if (state === 'connected' || state === 'completed') {
                    console.log('✅ WebRTC соединение установлено!');
                    setConnectionStatus('Соединение установлено');
                } else if (state === 'failed') {
                    console.error('❌ ICE соединение провалилось');
                    setConnectionStatus('Ошибка соединения');
                }
            };

            pc.onconnectionstatechange = () => {
                console.log('📡 Состояние соединения:', pc.connectionState);
            };

            console.log('✅ PeerConnection инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации PeerConnection:', error);
            setConnectionStatus(`Ошибка: ${error.message}`);
        }
    };

    const handleIceCandidate = async (candidate) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const leaveRoom = () => {
        if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
            signalingSocketRef.current.send(
                JSON.stringify({
                    type: 'leave-room',
                    from: 'receiver',
                })
            );
        }

        cleanup();
        setRemoteStream(null);
        setRoomInfo(null);
        setSelectedRoom('');
        setConnectionStatus('Отключено от комнаты');
        requestRoomList();
    };

    const cleanup = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Информация о текущей комнате */}
            {roomInfo && (
                <div
                    style={{
                        backgroundColor: '#e7f3ff',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                    }}
                >
                    <h3>{roomInfo.name}</h3>
                    <p>
                        <strong>Ведущий:</strong> {roomInfo.sender}
                    </p>
                    <p>
                        <strong>Статус:</strong> {connectionStatus}
                    </p>

                    <button
                        onClick={leaveRoom}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px',
                        }}
                    >
                        Покинуть комнату
                    </button>
                </div>
            )}

            {/* Видеоплеер */}
            <div
                style={{
                    position: 'relative',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    minHeight: '400px',
                    marginBottom: '20px',
                }}
            >
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    controls
                    muted
                    style={{
                        width: '100%',
                        display: remoteStream ? 'block' : 'none',
                    }}
                />

                {!remoteStream && roomInfo && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                        <div>Ожидание начала трансляции...</div>
                    </div>
                )}

                {!roomInfo && !remoteStream && (
                    <div
                        style={{
                            padding: '60px 20px',
                            textAlign: 'center',
                            color: '#666',
                        }}
                    >
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📺</div>
                        <div>Пум-пум-пум...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Receiver;
