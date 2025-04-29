import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import {
    activateMonster,
    deactivateMonster,
    updateDistance,
    resetTreasures,
    forceShowMonster,
    forceHideMonster
} from '../store/gameSlice';
import GameStart from './GameStart';
import GameProgress from './GameProgress';
import ARSceneManager from './ar/ARSceneManager';
import GameClear from './GameClear';

interface ARSceneProps {
    onSoundDetected?: () => void;
}

const ARScene: React.FC<ARSceneProps> = () => {
    const dispatch = useDispatch();
    const { monsterProximity, isGameStarted, treasureBoxes } = useSelector((state: RootState) => state.game);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [lastPosition, setLastPosition] = useState<GeolocationCoordinates | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [showClearAnimation, setShowClearAnimation] = useState(false);

    // 全ての宝箱が見つかったかをチェック
    const allTreasuresFound = treasureBoxes.every(box => box.found);

    // 宝箱を全て見つけたらクリア画面に遷移
    useEffect(() => {
        if (isGameStarted && allTreasuresFound && !showClearAnimation) {
            console.log('全ての宝箱を見つけました！ゲームクリア！');
            // 少し遅延させてからクリア画面を表示
            const timer = setTimeout(() => {
                setShowClearAnimation(true);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isGameStarted, allTreasuresFound, showClearAnimation]);

    // カメラの権限確認と初期化
    useEffect(() => {
        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'environment'
                    }
                });
                setCameraStream(stream);
                setHasCameraPermission(true);
            } catch (error) {
                console.error('カメラのアクセスに失敗しました:', error);
                setHasCameraPermission(false);
            }
        };

        initCamera();

        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // 位置情報の監視
    useEffect(() => {
        if (!isGameStarted) return;

        if ('geolocation' in navigator) {
            const watchId = navigator.geolocation.watchPosition((position) => {
                if (lastPosition) {
                    const distance = calculateDistance(
                        lastPosition.latitude,
                        lastPosition.longitude,
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    dispatch(updateDistance(distance));
                }
                setLastPosition(position.coords);
            });

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [lastPosition, dispatch, isGameStarted]);

    // 音声検知の設定
    useEffect(() => {
        if (!isGameStarted) return;

        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();

                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);

                analyserRef.current.fftSize = 256;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                let noiseCount = 0;
                let lastNoiseTime = Date.now();

                const checkVolume = () => {
                    if (analyserRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                        const now = Date.now();
                        // 閾値を下げる（元は30）
                        if (average > 20) {
                            noiseCount++;
                            // 必要な回数を減らす（元は3回）
                            if (noiseCount >= 2 && now - lastNoiseTime < 1000) {
                                dispatch(activateMonster());
                                lastNoiseTime = now;
                                noiseCount = 0;
                            }
                        } else {
                            // 無音判定までの時間を長くする（元は2000ms）
                            if (now - lastNoiseTime > 4000) {
                                dispatch(deactivateMonster());
                            }
                            noiseCount = Math.max(0, noiseCount - 1);
                        }
                    }
                    requestAnimationFrame(checkVolume);
                };

                checkVolume();
            } catch (error) {
                console.error('マイクのアクセスに失敗しました:', error);
            }
        };

        initAudio();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [dispatch, isGameStarted]);

    // 距離計算関数
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // 宝箱のリセット
    const handleResetTreasures = () => {
        dispatch(resetTreasures());
        setShowClearAnimation(false);
        console.log('宝箱の状態をリセットしました');
    };

    // デバッグ機能の表示切り替え
    const toggleDebug = () => {
        setShowDebug(!showDebug);
    };

    // モンスターを強制表示
    const handleShowMonster = () => {
        dispatch(forceShowMonster());
    };

    // モンスターを強制非表示
    const handleHideMonster = () => {
        dispatch(forceHideMonster());
    };

    if (!isGameStarted) {
        return <GameStart />;
    }

    if (showClearAnimation) {
        return <GameClear />;
    }

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: `rgba(0, 0, 0, ${monsterProximity / 200})`,
                    pointerEvents: 'none',
                    transition: 'background-color 0.5s ease',
                    zIndex: 1
                }}
            />
            <ARSceneManager />
            {!hasCameraPermission && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: '1.2em',
                    zIndex: 2,
                    textAlign: 'center'
                }}>
                    カメラのアクセスを許可してください
                </div>
            )}
            <GameProgress />

            {/* モンスター操作ボタン */}
            <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 999 }}>
                <button
                    onClick={handleShowMonster}
                    style={{
                        padding: '10px',
                        backgroundColor: '#FF5722',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        opacity: 0.8,
                        marginRight: '10px',
                        fontSize: '0.9em'
                    }}
                >
                    モンスター出現
                </button>
                <button
                    onClick={handleHideMonster}
                    style={{
                        padding: '10px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        opacity: 0.8,
                        fontSize: '0.9em'
                    }}
                >
                    モンスター非表示
                </button>
            </div>

            {/* デバッグツール */}
            <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999 }}>
                <button
                    onClick={toggleDebug}
                    style={{
                        padding: '10px',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        opacity: 0.7
                    }}
                >
                    デバッグ {showDebug ? '▲' : '▼'}
                </button>

                {showDebug && (
                    <div style={{
                        marginTop: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: '15px',
                        borderRadius: '10px'
                    }}>
                        <div style={{ marginBottom: '10px', color: 'white' }}>
                            <p>宝箱の状態:</p>
                            {treasureBoxes.map((box, i) => (
                                <div key={i}>
                                    宝箱{i + 1}: {box.found ? '発見済み' : '未発見'}
                                </div>
                            ))}
                            <div style={{ marginTop: '10px', fontWeight: 'bold', color: allTreasuresFound ? '#4CAF50' : 'white' }}>
                                全宝箱発見: {allTreasuresFound ? 'はい' : 'いいえ'}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                モンスター接近度: {monsterProximity}/200
                            </div>
                        </div>
                        <button
                            onClick={handleResetTreasures}
                            style={{
                                padding: '8px 15px',
                                backgroundColor: '#F44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                width: '100%'
                            }}
                        >
                            宝箱をリセット
                        </button>
                    </div>
                )}
            </div>

            {/* 宝箱を全て見つけた時の祝福エフェクト（クリア画面の前） */}
            {isGameStarted && allTreasuresFound && !showClearAnimation && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 10,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '3em',
                        color: '#FFD700',
                        fontWeight: 'bold',
                        textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                        animation: 'pulseAndFade 1.5s ease-in-out forwards'
                    }}>
                        全ての宝箱を発見しました！
                    </div>
                </div>
            )}

            <style>
                {`
                @keyframes pulseAndFade {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
                }
                `}
            </style>
        </>
    );
};

export default ARScene; 