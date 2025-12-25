// ScreenShare.jsx
import React, { useState, useRef, useEffect } from 'react';

const WEBRTC_CONFIG = {
    iceServers: [
        {
            urls: [
                'turn:172.17.0.3:3478?transport=udp',
                'turn:172.17.0.3:3478?transport=tcp',
                'turns:172.17.0.3:5349?transport=tcp'  // Если используете TLS
            ],
            username: 'testuser',
            credential: 'testpassword'
        }
    ],
    // КРИТИЧЕСКИ ВАЖНЫЕ НАСТРОЙКИ:
    iceTransportPolicy: 'relay',        // ТОЛЬКО через TURN
    iceCandidatePoolSize: 0,           // 0 = без ограничений
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
};

const ScreenShare = () => {
    const wsRef = useRef(null);
    const [ws, setWs] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [sources, setSources] = useState([]);
    const [error, setError] = useState(''); // Добавлено
    const [status, setStatus] = useState('Ожидание...'); // Добавлено
    const peerConnectionRef = useRef(null);
    const localVideoRef = useRef(null); // Добавлено

    // Автоматическое обновление video элемента
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);


    useEffect(() => {
        // Подключаемся к сигнальному серверу
        const socket = new WebSocket('ws://localhost:8080');
        const ws = socket;
        wsRef.current = ws;
        socket.onopen = () => {
            console.log('✅ Подключились к сигнальному серверу');
            setWs(socket);
        };

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Сообщение от сервера:', data.type);

                if (data.type === 'answer' && peerConnectionRef.current) {
                    console.log('📥 Получен ответ от получателя');
                    const answer = new RTCSessionDescription({
                        type: 'answer',
                        sdp: data.sdp
                    });
                    await peerConnectionRef.current.setRemoteDescription(answer);
                    console.log('✅ Ответ установлен как удаленное описание');
                }

                else if (data.type === 'ice-candidate' && peerConnectionRef.current) {
                    console.log('🧊 Получен ICE кандидат от получателя');
                    try {
                        await peerConnectionRef.current.addIceCandidate(
                            new RTCIceCandidate(data.candidate)
                        );
                        console.log('✅ ICE кандидат получателя добавлен');
                    } catch (iceError) {
                        console.error('❌ Ошибка добавления ICE кандидата:', iceError);
                    }
                }

                else {
                    console.log('📭 Другое сообщение:', data.type);
                }

            } catch (error) {
                console.error('❌ Ошибка обработки сообщения:', error);
            }
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        }
    }, []);

    // Получение списка экранов/окон
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

    // Захват выбранного экрана
    const startSharing = async (sourceId) => {
        setStatus('Начинаю захват...');
        setError('');

        // 1. Если sourceId не передан, используем первый из списка
        if (!sourceId) {
            if (sources.length === 0) {
                console.log('Нет источников, запрашиваю...');
                const srcs = await getSources();
                if (srcs.length > 0) {
                    sourceId = srcs[0].id;
                }
            } else {
                sourceId = sources[0].id;
            }
        }

        if (!sourceId) {
            setError('Нет доступных источников экрана');
            setStatus('Ошибка');
            return;
        }

        console.log('Пытаюсь захватить sourceId:', sourceId);

        try {
            // 2. Правильные constraints для Electron
            const constraints = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        minFrameRate: 5,
                        maxFrameRate: 30,
                        minWidth: 640,
                        maxWidth: 1920,
                        minHeight: 480,
                        maxHeight: 1080
                    }
                }
            };

            console.log('Использую constraints:', constraints);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('✅ Поток успешно получен!');
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log('Разрешение:', `${settings.width}x${settings.height}`, 'FPS:', settings.frameRate);

            setLocalStream(stream);
            setStatus('Трансляция запущена');

            // Создаем WebRTC соединение
            createPeerConnection(stream);

        } catch (error) {
            console.error('❌ Ошибка захвата:', error);
            setError(`Ошибка захвата: ${error.message}`);
            setStatus('Ошибка');

            // Пробуем альтернативный метод
            tryAlternativeMethod(sourceId);
        }
    };

    // Альтернативный метод для сложных случаев
    const tryAlternativeMethod = async (sourceId) => {
        console.log('Пробую альтернативный метод захвата...');
        setStatus('Пробую альтернативный метод...');

        try {
            // Упрощенные constraints
            const constraints = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Альтернативный метод сработал!');
            setLocalStream(stream);
            setStatus('Трансляция запущена (альтернативный метод)');
            setError('');

            createPeerConnection(stream);

        } catch (altError) {
            console.error('❌ Альтернативный метод тоже не сработал:', altError);
            setError(`Альтернативный метод не сработал: ${altError.message}`);
            setStatus('Ошибка');
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

// Отдельная функция для создания и отправки оффера
    const createAndSendOffer = async (pc) => {
        try {
            console.log('🔄 Создаю оффер...');
            const offer = await pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false
            });

            console.log('✅ Оффер создан типа:', offer.type);

            // Устанавливаем локальное описание
            await pc.setLocalDescription(offer);
            console.log('✅ Локальное описание установлено');

            // Отправляем через WebSocket
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'offer',
                    sdp: offer.sdp,
                    from: 'sender',
                    timestamp: Date.now()
                }));
                console.log('📤 Оффер отправлен получателю');
            } else {
                console.error('❌ WebSocket не подключен!');
                setError('Нет подключения к сигнальному серверу');
            }

        } catch (error) {
            console.error('❌ Ошибка создания оффера:', error);

            if (error.message.includes('subsequent offer') || error.message.includes('m-lines')) {
                console.log('🔄 Ошибка SDP. Жду 2 секунды и пробую снова...');
                setTimeout(() => {
                    if (peerConnectionRef.current) {
                        createAndSendOffer(peerConnectionRef.current);
                    }
                }, 2000);
            }
        }
    };

    // Создание оффера
    const createOffer = async (pc) => {
        try {
            const offer = await pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false
            });

            await pc.setLocalDescription(offer);
            console.log('SDP оффер создан:', offer.type);

            // Здесь будет отправка оффера через сигнальный сервер
            // Например: signalingSend({ type: 'offer', sdp: offer.sdp });

        } catch (error) {
            console.error('Ошибка создания оффера:', error);
        }
    };

    // Остановка трансляции
    const stopSharing = () => {
        if (peerConnectionRef.current) {
            console.log('Закрываю PeerConnection...');
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        setStatus('Трансляция остановлена');
        setError('');
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Трансляция экрана</h2>

            {/* Новая кнопка для открытия получателя */}
            <div style={{ marginBottom: '20px' }}>
                <a
                    href="/receiver"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        marginRight: '10px',
                        fontWeight: 'bold'
                    }}
                >
                    📺 Открыть приемник (новая вкладка)
                </a>
            </div>

            {/* Статус и ошибки */}
            <div style={{
                padding: '10px',
                marginBottom: '20px',
                backgroundColor: error ? '#f8d7da' : (status.includes('Трансляция') ? '#d4edda' : '#fff3cd'),
                borderRadius: '5px',
                border: `1px solid ${error ? '#f5c6cb' : (status.includes('Трансляция') ? '#c3e6cb' : '#ffeeba')}`
            }}>
                <strong>Статус:</strong> {status}
                {error && <div style={{ color: '#721c24', marginTop: '5px' }}><strong>Ошибка:</strong> {error}</div>}
            </div>

            {/* Кнопки управления */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={getSources}
                    style={{
                        padding: '10px 15px',
                        marginRight: '10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Получить список экранов
                </button>

                <button
                    onClick={() => startSharing()}
                    disabled={sources.length === 0}
                    style={{
                        padding: '10px 15px',
                        marginRight: '10px',
                        backgroundColor: sources.length === 0 ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: sources.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                >
                    Начать трансляцию
                </button>

                <button
                    onClick={stopSharing}
                    disabled={!localStream}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: !localStream ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !localStream ? 'not-allowed' : 'pointer'
                    }}
                >
                    Остановить трансляцию
                </button>
            </div>

            {/* Список источников */}
            {sources.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>Доступные источники:</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {sources.map((source, index) => (
                            <div
                                key={source.id}
                                onClick={() => startSharing(source.id)}
                                style={{
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    width: '150px',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    marginBottom: '5px'
                                }}>
                                    {source.name.length > 20 ? source.name.substring(0, 20) + '...' : source.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {source.id.includes('screen') ? 'Экран' : 'Окно'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Видео превью */}
            {localStream && (
                <div>
                    <h3>Ваш экран:</h3>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        style={{
                            width: '600px',
                            maxWidth: '100%',
                            border: '2px solid #007bff',
                            borderRadius: '5px'
                        }}
                    />
                </div>
            )}

            {/* Отладочная информация */}
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <p>Для тестирования трансляции на другом устройстве:</p>
                <ol>
                    <li>Убедитесь, что Coturn сервер запущен</li>
                    <li>Настройте сигнальный сервер (WebSocket)</li>
                    <li>На другом устройстве откройте страницу приемника</li>
                    <li>Обменяйтесь SDP офферами через сигнальный сервер</li>
                </ol>
            </div>
        </div>
    );
};

export default ScreenShare;
