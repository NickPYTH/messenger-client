// Receiver.jsx
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

const Receiver = () => {

    const [connectionStatus, setConnectionStatus] = useState('Ожидание подключения...');
    const [remoteStream, setRemoteStream] = useState(null);
    const [signalingConnected, setSignalingConnected] = useState(false);
    const [iceCandidates, setIceCandidates] = useState([]);
    const peerConnectionRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const signalingSocketRef = useRef(null);
    const [videoLoading, setVideoLoading] = useState(false);

    // Конфигурация WebRTC (ДОЛЖНА совпадать с отправителем!)



    // Инициализация при монтировании компонента
    useEffect(() => {
        initializeReceiver();

        return () => {
            cleanup();
        };
    }, []);

    // Обновление видео элемента при получении потока
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log('📹 Видео назначено на элемент получателя');
        }
    }, [remoteStream]);

    const initializeReceiver = () => {
        console.log('🔄 Инициализация получателя...');
        try {
            const pc = new RTCPeerConnection(WEBRTC_CONFIG);
            peerConnectionRef.current = pc;

            // Обработка входящих медиапотоков
            pc.ontrack = (event) => {
                console.log('🎬 Получен удаленный медиапоток!', event);

                if (event.streams && event.streams[0]) {
                    console.log('📹 Поток получен, треки:', event.streams[0].getTracks().length);

                    const stream = event.streams[0];
                    setRemoteStream(stream);

                    // Ждем немного чтобы React обновил DOM
                    setTimeout(() => {
                        if (remoteVideoRef.current) {
                            console.log('📺 Прикрепляю поток к видео...');
                            remoteVideoRef.current.srcObject = stream;

                            // ВАЖНО: Ставим muted для автозапуска
                            remoteVideoRef.current.muted = true;

                            // Ждем когда видео будет готово
                            const tryPlay = () => {
                                if (remoteVideoRef.current.readyState >= 1) { // HAVE_METADATA
                                    remoteVideoRef.current.play().then(() => {
                                        console.log('✅ Видео запущено!');
                                    }).catch(error => {
                                        console.log('⚠️ Автозапуск заблокирован:', error.message);
                                        console.log('   Кликните по видео для запуска');
                                    });
                                } else {
                                    console.log('⏳ Жду загрузки видео... readyState:', remoteVideoRef.current.readyState);
                                    setTimeout(tryPlay, 500);
                                }
                            };

                            tryPlay();
                        } else {
                            console.error('❌ remoteVideoRef.current не найден!');
                        }
                    }, 300); // Увеличьте задержку для React
                }
            };

            // Отслеживание состояния ICE соединения
            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                console.log('🔌 ICE состояние:', state);
                setConnectionStatus(`ICE: ${state}`);

                if (state === 'connected' || state === 'completed') {
                    console.log('✅ WebRTC соединение установлено!');
                } else if (state === 'failed' || state === 'disconnected') {
                    console.warn('⚠️ Проблемы с соединением:', state);
                }
            };

            // Сбор ICE кандидатов
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 ICE кандидат получателя:', event.candidate);
                    setIceCandidates(prev => [...prev, {
                        type: event.candidate.type,
                        protocol: event.candidate.protocol,
                        address: event.candidate.address
                    }]);

                    // Отправляем кандидата через сигнальный сервер
                    if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
                        signalingSocketRef.current.send(JSON.stringify({
                            type: 'ice-candidate',
                            candidate: event.candidate,
                            from: 'receiver'
                        }));
                    }
                } else {
                    console.log('✅ Все ICE кандидаты собраны');
                }
            };

            // Отслеживание состояния сигнального соединения
            pc.onsignalingstatechange = () => {
                console.log('📡 Сигнальное состояние:', pc.signalingState);
            };

            setConnectionStatus('✅ Получатель готов к приему');
            console.log('✅ PeerConnection инициализирован');

        } catch (error) {
            console.error('❌ Ошибка инициализации получателя:', error);
            setConnectionStatus(`❌ Ошибка: ${error.message}`);
        }
    };

    const video = document.querySelector('video');

// 3. Если srcObject есть, проверьте треки
    if (video?.srcObject) {
        const tracks = video.srcObject.getTracks();
        console.log('3. Треков в srcObject:', tracks.length);
        tracks.forEach((track, i) => {
            console.log(`   Трек ${i}:`, track.kind, track.readyState, track.enabled);
        });
    }



    const connectToSignalingServer = () => {
        try {
            if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
                console.log('✅ WebSocket уже подключен');
                return;
            }

            const wsUrl = 'ws://localhost:8080';
            console.log(`Подключаюсь к сигнальному серверу: ${wsUrl}`);

            const ws = new WebSocket(wsUrl);
            signalingSocketRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Подключение к сигнальному серверу установлено');
                setSignalingConnected(true);
                setConnectionStatus('✅ Сигнальный сервер подключен');
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 Получено сообщение:', data.type);

                    switch (data.type) {
                        case 'offer':
                            console.log('📥 Получен SDP оффер от отправителя');
                            await handleOffer(data.sdp, ws); // ← Передаем текущий сокет
                            break;

                        case 'ice-candidate':
                            console.log('🧊 Получен ICE кандидат от отправителя');
                            await handleIceCandidate(data.candidate);
                            break;

                        default:
                            console.log('📭 Неизвестный тип сообщения:', data.type);
                    }
                } catch (error) {
                    console.error('❌ Ошибка обработки сообщения:', error);
                }
            };

            ws.onclose = () => {
                console.log('🔌 Отключение от сигнального сервера');
                setSignalingConnected(false);
                setConnectionStatus('🔌 Сигнальный сервер отключен');
            };

            ws.onerror = (error) => {
                console.error('❌ Ошибка WebSocket:', error);
                setConnectionStatus('❌ Ошибка подключения к сигнальному серверу');
            };

        } catch (error) {
            console.error('❌ Ошибка подключения к сигнальному серверу:', error);
        }
    };

    const handleOffer = async (sdpOffer, socket = signalingSocketRef.current) => {
        if (!peerConnectionRef.current || !socket) {
            console.error('❌ Нет PeerConnection или WebSocket');
            return;
        }

        try {
            console.log('🔄 Устанавливаю удаленное описание...');
            await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: sdpOffer })
            );
            console.log('✅ Удаленное описание установлено');

            console.log('🔄 Создаю ответ...');
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            console.log('✅ Ответ создан и установлен локально');

            // Отправляем ответ через тот же сокет
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'answer',
                    sdp: answer.sdp,
                    from: 'receiver'
                }));
                console.log('📤 Ответ отправлен отправителю');
            } else {
                console.error('❌ WebSocket не подключен');
            }

        } catch (error) {
            console.error('❌ Ошибка обработки оффера:', error);
            console.error('Полная ошибка:', error.message);

            if (error.message.includes('subsequent offer') || error.message.includes('m-lines')) {
                // Пересоздаем соединение
                console.log('🔄 Пересоздаю PeerConnection из-за ошибки SDP...');
                cleanup();
                initializeReceiver();
            }
        }
    };

    const handleIceCandidate = async (candidate) => {
        if (!peerConnectionRef.current) return;

        try {
            await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
            console.log('✅ ICE кандидат добавлен');
        } catch (error) {
            console.error('❌ Ошибка добавления ICE кандидата:', error);
        }
    };

    const createTestOffer = async () => {
        if (!peerConnectionRef.current) return;

        try {
            console.log('🧪 Создаю тестовый оффер...');
            const offer = await peerConnectionRef.current.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false
            });

            await peerConnectionRef.current.setLocalDescription(offer);
            console.log('✅ Тестовый оффер создан');

            // Для отладки: выводим оффер в консоль
            console.log('📋 Тестовый SDP оффер (первые 200 символов):',
                offer.sdp?.substring(0, 200) + '...');

        } catch (error) {
            console.error('❌ Ошибка создания тестового оффера:', error);
        }
    };

    const cleanup = () => {
        console.log('🧹 Очистка ресурсов получателя...');

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (signalingSocketRef.current) {
            signalingSocketRef.current.close();
            signalingSocketRef.current = null;
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        setSignalingConnected(false);
        setConnectionStatus('Соединение закрыто');
    };

    const getConnectionStats = () => {
        if (!peerConnectionRef.current || !remoteStream) return null;

        const videoTrack = remoteStream.getVideoTracks()[0];
        if (!videoTrack) return null;

        const settings = videoTrack.getSettings();
        return {
            resolution: `${settings.width || '?'}x${settings.height || '?'}`,
            frameRate: settings.frameRate || '?',
            codec: settings.videoCodec || '?',
            iceState: peerConnectionRef.current.iceConnectionState
        };
    };

    const stats = getConnectionStats();

    async function checkVideoData() {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        const stats = await pc.getStats();
        let videoBytes = 0;
        let videoPackets = 0;

        stats.forEach(report => {
            // Видео байты полученные
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                videoBytes = report.bytesReceived;
                videoPackets = report.packetsReceived;
                console.log('📊 Видео статистика:', {
                    bytes: report.bytesReceived,
                    packets: report.packetsReceived,
                    bitrate: (report.bytesReceived * 8 / 1000).toFixed(1) + ' kbps',
                    framesDecoded: report.framesDecoded || 0
                });
            }

            // ICE соединение
            if (report.type === 'candidate-pair' && report.nominated) {
                console.log('🔗 Активная ICE пара:', {
                    state: report.state,
                    bytesSent: report.bytesSent,
                    bytesReceived: report.bytesReceived
                });
            }
        });

        console.log(`🎬 Видео получено: ${videoBytes} байт, ${videoPackets} пакетов`);

        if (videoBytes === 0) {
            console.error('❌ НЕТ ДАННЫХ ВИДЕО! Проблема в кодеках или передаче');
        } else {
            console.log('✅ Данные видео идут! Проблема только в отображении');
        }
    }
    checkVideoData();

    // Мониторинг состояния видео каждую секунду
    const videoMonitor = setInterval(() => {
        const video = remoteVideoRef.current;
        if (video) {
            console.log('📊 Видео состояние:', {
                readyState: ['НИЧЕГО', 'МЕТАДАННЫЕ', 'ТЕКУЩИЕ ДАННЫЕ', 'БУДУЩИЕ ДАННЫЕ', 'ДОСТАТОЧНО ДАННЫХ'][video.readyState],
                currentTime: video.currentTime,
                paused: video.paused,
                muted: video.muted,
                buffered: video.buffered.length ? video.buffered.end(0) : 0,
                networkState: ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'][video.networkState]
            });

            // Если есть буфер но не играет
            if (video.buffered.length > 0 && video.paused) {
                console.log('⚠️ Есть буфер данных, но видео на паузе. Пробую запустить...');
                video.play().catch(e => console.log('Не удалось:', e.message));
            }
        }
    }, 1000);

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
                🖥️ Приемник трансляции
            </h2>
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '800px',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                minHeight: '400px'
            }}>
                <video
                    key="remote-video"
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    controls
                    muted={true}
                    onLoadStart={() => setVideoLoading(true)}
                    onLoadedData={() => setVideoLoading(false)}
                    onError={(e) => console.error('Video error:', e.target.error)}
                    style={{
                        width: '100%',
                        display: remoteStream ? 'block' : 'none'
                    }}
                />

                {/* Индикатор загрузки */}
                {videoLoading && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: '16px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '10px 20px',
                        borderRadius: '8px'
                    }}>
                        ⏳ Загрузка видео...
                    </div>
                )}

                {!remoteStream && (
                    <div style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#ecf0f1'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📺</div>
                        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                            Трансляция еще не началась
                        </div>
                    </div>
                )}
            </div>
            {/* Панель статуса */}
            <div style={{
                padding: '15px',
                marginBottom: '20px',
                backgroundColor: connectionStatus.includes('✅') ? '#d4edda' :
                    connectionStatus.includes('❌') ? '#f8d7da' : '#fff3cd',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: connectionStatus.includes('✅') ? '#c3e6cb' :
                    connectionStatus.includes('❌') ? '#f5c6cb' : '#ffeeba'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <strong style={{ fontSize: '16px' }}>Статус:</strong>
                    <span style={{ marginLeft: '10px', fontSize: '16px' }}>{connectionStatus}</span>
                </div>

                {stats && (
                    <div style={{ marginTop: '10px', fontSize: '14px' }}>
                        <div><strong>Разрешение:</strong> {stats.resolution}</div>
                        <div><strong>Частота кадров:</strong> {stats.frameRate} FPS</div>
                        <div><strong>Состояние ICE:</strong> {stats.iceState}</div>
                    </div>
                )}
            </div>

            {/* Панель управления */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={connectToSignalingServer}
                    disabled={signalingConnected}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: signalingConnected ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: signalingConnected ? 'default' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    {signalingConnected ? '✅ Подключено' : '📡 Подключиться к сигнальному серверу'}
                </button>

                <button
                    onClick={createTestOffer}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    🧪 Создать тестовый оффер
                </button>

                <button
                    onClick={cleanup}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: remoteStream ? '#dc3545' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: remoteStream ? 'pointer' : 'default',
                        fontSize: '14px'
                    }}
                >
                    🧹 Остановить и очистить
                </button>
            </div>

            {/* Видео область */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#34495e', marginBottom: '15px' }}>
                    {remoteStream ? '📹 Прямая трансляция' : '⏳ Ожидание трансляции'}
                </h3>

                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '800px',
                    backgroundColor: '#2c3e50',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {remoteStream ? (
                        <video
                            key="remote-video"
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            controls
                            muted={true}  // ВАЖНО: Добавьте muted для автозапуска
                            onLoadedData={(e) => {
                                console.log('✅ Видео загружено, readyState:', e.target.readyState);
                                e.target.play().catch(err => {
                                    console.log('Автозапуск с muted:', err.message);
                                });
                            }}
                            onCanPlay={(e) => {
                                console.log('🎬 Видео готово к воспроизведению');
                                e.target.play().catch(err => {
                                    console.log('Попытка воспроизведения:', err.message);
                                });
                            }}
                            onPlay={(e) => {
                                console.log('▶️ Видео воспроизводится!');
                                setConnectionStatus('✅ Видео активно');
                            }}
                            onPause={(e) => {
                                console.log('⏸️ Видео на паузе');
                            }}
                            style={{
                                width: '100%',
                                display: remoteStream ? 'block' : 'none',
                                backgroundColor: '#000'
                            }}
                        />
                    ) : (
                        <div style={{
                            padding: '60px 20px',
                            textAlign: 'center',
                            color: '#ecf0f1'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📺</div>
                            <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                                Трансляция еще не началась
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                Подключитесь к сигнальному серверу и дождитесь оффера от отправителя
                            </div>
                        </div>
                    )}

                    {/* Overlay для отладки */}
                    {remoteStream && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}>
                            LIVE
                        </div>
                    )}
                </div>
            </div>

            {/* Панель отладки */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <h4 style={{ color: '#495057', marginBottom: '15px' }}>🔧 Отладочная информация</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <h5 style={{ fontSize: '14px', color: '#6c757d' }}>WebRTC состояние</h5>
                        <div style={{ fontSize: '13px' }}>
                            <div>ICE: {peerConnectionRef.current?.iceConnectionState || 'не инициализирован'}</div>
                            <div>Сигнальное: {peerConnectionRef.current?.signalingState || 'не инициализирован'}</div>
                            <div>Соединение: {peerConnectionRef.current?.connectionState || 'не инициализирован'}</div>
                        </div>
                    </div>

                    <div>
                        <h5 style={{ fontSize: '14px', color: '#6c757d' }}>ICE кандидаты</h5>
                        <div style={{ fontSize: '13px', maxHeight: '100px', overflowY: 'auto' }}>
                            {iceCandidates.length > 0 ? (
                                iceCandidates.slice(-5).map((candidate, index) => (
                                    <div key={index} style={{ marginBottom: '3px' }}>
                                        {candidate.type} ({candidate.protocol}): {candidate.address}
                                    </div>
                                ))
                            ) : (
                                <div>Еще не собраны</div>
                            )}
                            <div style={{ fontSize: '11px', color: '#868e96', marginTop: '5px' }}>
                                Всего: {iceCandidates.length}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '15px', fontSize: '12px', color: '#868e96' }}>
                    <div><strong>Для тестирования:</strong></div>
                    <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
                        <li>Запустите сигнальный сервер (node signaling-server.js)</li>
                        <li>Нажмите "Подключиться к сигнальному серверу"</li>
                        <li>На отправителе начните трансляцию</li>
                        <li>Дождитесь автоматического обмена SDP/ICE</li>
                        <li>Видео появится автоматически</li>
                    </ol>
                </div>
            </div>

            {/* Информация о Coturn */}
            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1565c0'
            }}>
                <strong>ℹ️ Важно:</strong> Убедитесь, что ваш Coturn сервер работает на
                <code style={{ margin: '0 5px', backgroundColor: '#bbdefb', padding: '2px 6px', borderRadius: '3px' }}>
                    turn:localhost:3478
                </code>
                (или укажите правильный IP для сетевого тестирования)
            </div>
        </div>
    );
};

export default Receiver;
