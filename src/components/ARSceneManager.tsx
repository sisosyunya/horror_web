import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { findTreasure } from '../store/gameSlice';
import 'aframe';
import 'aframe-ar';

interface ARSceneManagerProps {
    cameraStream: MediaStream | null;
}

const ARSceneManager: React.FC<ARSceneManagerProps> = ({ cameraStream }) => {
    const dispatch = useDispatch();
    const { monsterProximity, treasureBoxes } = useSelector((state: RootState) => state.game);
    const sceneRef = useRef<HTMLDivElement>(null);
    const [isSceneLoaded, setIsSceneLoaded] = useState(false);
    const sceneInstanceRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!window.AFRAME || !sceneRef.current || !cameraStream) return;

        // 既存のシーンをクリア
        if (sceneInstanceRef.current) {
            sceneInstanceRef.current.parentNode?.removeChild(sceneInstanceRef.current);
            sceneInstanceRef.current = null;
        }

        // シーンの作成
        const scene = document.createElement('a-scene');
        scene.setAttribute('embedded', '');
        scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; sourceWidth: 1280; sourceHeight: 720; displayWidth: 1280; displayHeight: 720;');
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

            // シンプルなモンスターの表示
            const monsterBody = document.createElement('a-sphere');
            monsterBody.setAttribute('radius', '0.5');
            monsterBody.setAttribute('material', 'color: #FF0000; opacity: 0.8');
            monsterBody.setAttribute('animation', 'property: scale; to: 1.2 1.2 1.2; dur: 1000; dir: alternate; loop: true');
            monsterEntity.appendChild(monsterBody);
            scene.appendChild(monsterEntity);
        }

        // 宝箱の追加
        treasureBoxes.forEach((box, index) => {
            if (!box.found) {
                const treasureEntity = document.createElement('a-entity');
                treasureEntity.setAttribute('position', `${box.x} ${box.y} ${box.z}`);

                // シンプルな宝箱の表示
                const treasureBox = document.createElement('a-box');
                treasureBox.setAttribute('width', '0.4');
                treasureBox.setAttribute('height', '0.4');
                treasureBox.setAttribute('depth', '0.4');
                treasureBox.setAttribute('material', 'color: #FFD700');
                treasureBox.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true');
                treasureBox.setAttribute('class', 'clickable');
                treasureBox.setAttribute('data-treasure-index', index.toString());
                treasureBox.addEventListener('click', () => dispatch(findTreasure(index)));
                treasureEntity.appendChild(treasureBox);
                scene.appendChild(treasureEntity);
            }
        });

        // シーンの追加
        sceneRef.current.appendChild(scene);
        sceneInstanceRef.current = scene;

        // シーンの読み込み完了を監視
        scene.addEventListener('loaded', () => {
            setIsSceneLoaded(true);
        });

        return () => {
            if (sceneInstanceRef.current) {
                sceneInstanceRef.current.parentNode?.removeChild(sceneInstanceRef.current);
                sceneInstanceRef.current = null;
                setIsSceneLoaded(false);
            }
        };
    }, [monsterProximity, treasureBoxes, dispatch, cameraStream]);

    return (
        <>
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
            {!isSceneLoaded && (
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

export default ARSceneManager; 