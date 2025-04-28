import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { activateMonster, deactivateMonster, updateDistance } from '../store/gameSlice';
import GameStart from './GameStart';
import GameProgress from './GameProgress';
import ARSceneManager from './ARSceneManager';

interface ARSceneProps {
    onSoundDetected: () => void;
}

const ARScene: React.FC<ARSceneProps> = ({ onSoundDetected }) => {
    const dispatch = useDispatch();
    const { monsterProximity, isGameStarted } = useSelector((state: RootState) => state.game);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [lastPosition, setLastPosition] = useState<GeolocationCoordinates | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

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
                        if (average > 30) {
                            noiseCount++;
                            if (noiseCount >= 3 && now - lastNoiseTime < 1000) {
                                dispatch(activateMonster());
                                lastNoiseTime = now;
                                noiseCount = 0;
                            }
                        } else {
                            if (now - lastNoiseTime > 2000) {
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

    if (!isGameStarted) {
        return <GameStart />;
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
            <ARSceneManager cameraStream={cameraStream} />
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
        </>
    );
};

export default ARScene; 