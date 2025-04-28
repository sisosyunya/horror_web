import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { activateMonster, deactivateMonster, updateDistance, findTreasure } from '../store/gameSlice';
import GameStart from './GameStart';
import 'aframe';
import 'aframe-ar';

interface ARSceneProps {
    onSoundDetected: () => void;
}

const ARScene: React.FC<ARSceneProps> = ({ onSoundDetected }) => {
    const dispatch = useDispatch();
    const { monsterProximity, treasureBoxes, isGameStarted } = useSelector((state: RootState) => state.game);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [lastPosition, setLastPosition] = useState<GeolocationCoordinates | null>(null);
    const sceneRef = useRef<HTMLDivElement>(null);
    const [isSceneLoaded, setIsSceneLoaded] = useState(false);
    const sceneInstanceRef = useRef<HTMLElement | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);

    // カメラの権限確認
    useEffect(() => {
        const checkCameraPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                setHasCameraPermission(true);
            } catch (error) {
                console.error('カメラのアクセスに失敗しました:', error);
                setHasCameraPermission(false);
            }
        };

        checkCameraPermission();
    }, []);

    // A-Frameコンポーネントの登録
    useEffect(() => {
        if (!window.AFRAME) {
            console.error('A-Frameが読み込まれていません');
            return;
        }

        // カスタムコンポーネントの登録
        if (!window.AFRAME.components['ar-scene-loaded']) {
            window.AFRAME.registerComponent('ar-scene-loaded', {
                schema: {},
                init: function () {
                    setIsSceneLoaded(true);
                },
                remove: function () {
                    setIsSceneLoaded(false);
                }
            });
        }

        return () => {
            if (sceneInstanceRef.current) {
                sceneInstanceRef.current.parentNode?.removeChild(sceneInstanceRef.current);
                sceneInstanceRef.current = null;
            }
        };
    }, []);

    // A-Frameシーンの作成と更新
    useEffect(() => {
        if (!window.AFRAME || !sceneRef.current || !hasCameraPermission || !isGameStarted) return;

        // 既存のシーンをクリア
        if (sceneInstanceRef.current) {
            sceneInstanceRef.current.parentNode?.removeChild(sceneInstanceRef.current);
            sceneInstanceRef.current = null;
        }

        // シーンの作成
        const scene = document.createElement('a-scene');
        scene.setAttribute('embedded', '');
        scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; sourceWidth: 1280; sourceHeight: 720; displayWidth: 1280; displayHeight: 720;');
        scene.setAttribute('ar-scene-loaded', '');
        scene.setAttribute('vr-mode-ui', 'enabled: false');
        scene.setAttribute('renderer', 'logarithmicDepthBuffer: true;');
        scene.setAttribute('loading-screen', 'enabled: false');

        // カメラの追加
        const camera = document.createElement('a-entity');
        camera.setAttribute('camera', '');
        camera.setAttribute('position', '0 0 0');
        camera.setAttribute('look-controls', 'enabled: false');
        camera.setAttribute('arjs-device-orientation-controls', 'smoothingFactor: 0.8');
        scene.appendChild(camera);

        // モンスターの追加
        if (monsterProximity > 0) {
            const monsterEntity = document.createElement('a-entity');
            monsterEntity.setAttribute('position', `0 ${1 + monsterProximity / 100} -${3 - monsterProximity / 50}`);

            const monsterBody = document.createElement('a-box');
            monsterBody.setAttribute('width', '0.5');
            monsterBody.setAttribute('height', '1');
            monsterBody.setAttribute('depth', '0.5');
            monsterBody.setAttribute('material', 'color: #FF0000; opacity: 0.8');
            monsterBody.setAttribute('animation', 'property: position; to: 0 0.2 0; dur: 1000; dir: alternate; loop: true');

            const monsterHead = document.createElement('a-sphere');
            monsterHead.setAttribute('position', '0 1.2 0');
            monsterHead.setAttribute('radius', '0.3');
            monsterHead.setAttribute('material', 'color: #FF0000; opacity: 0.8');

            monsterEntity.appendChild(monsterBody);
            monsterEntity.appendChild(monsterHead);
            scene.appendChild(monsterEntity);
        }

        // 宝箱の追加
        treasureBoxes.forEach((box, index) => {
            if (!box.found) {
                const treasureEntity = document.createElement('a-entity');
                treasureEntity.setAttribute('position', `${box.x} ${box.y} ${box.z}`);

                const treasureBox = document.createElement('a-box');
                treasureBox.setAttribute('width', '0.4');
                treasureBox.setAttribute('height', '0.3');
                treasureBox.setAttribute('depth', '0.4');
                treasureBox.setAttribute('material', 'color: #FFD700');
                treasureBox.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true');
                treasureBox.setAttribute('class', 'clickable');
                treasureBox.setAttribute('data-treasure-index', index.toString());
                treasureBox.addEventListener('click', () => dispatch(findTreasure(index)));

                const treasureLid = document.createElement('a-box');
                treasureLid.setAttribute('position', '0 0.15 0');
                treasureLid.setAttribute('width', '0.4');
                treasureLid.setAttribute('height', '0.1');
                treasureLid.setAttribute('depth', '0.4');
                treasureLid.setAttribute('material', 'color: #B8860B');

                treasureEntity.appendChild(treasureBox);
                treasureEntity.appendChild(treasureLid);
                scene.appendChild(treasureEntity);
            }
        });

        // シーンの追加
        sceneRef.current.appendChild(scene);
        sceneInstanceRef.current = scene;

        return () => {
            if (sceneInstanceRef.current) {
                sceneInstanceRef.current.parentNode?.removeChild(sceneInstanceRef.current);
                sceneInstanceRef.current = null;
            }
        };
    }, [monsterProximity, treasureBoxes, dispatch, hasCameraPermission, isGameStarted]);

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
            <div
                ref={sceneRef}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'fixed',
                    top: 0,
                    left: 0
                }}
            />
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
            {hasCameraPermission && !isSceneLoaded && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: '1.2em',
                    zIndex: 2
                }}>
                    ARシーンを読み込み中...
                </div>
            )}
        </>
    );
};

export default ARScene; 