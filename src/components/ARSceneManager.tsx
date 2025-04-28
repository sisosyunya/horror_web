import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { findTreasure } from '../store/gameSlice';

interface ARSceneManagerProps {
    cameraStream: MediaStream | null;
}

const ARSceneManager: React.FC<ARSceneManagerProps> = ({ cameraStream }) => {
    const dispatch = useDispatch();
    const { monsterProximity, treasureBoxes } = useSelector((state: RootState) => state.game);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSceneLoaded, setIsSceneLoaded] = useState(false);
    const aframeScriptLoaded = useRef(false);
    const arjsScriptLoaded = useRef(false);

    // スクリプトの読み込み
    useEffect(() => {
        if (aframeScriptLoaded.current && arjsScriptLoaded.current) return;

        const loadScripts = async () => {
            // A-Frame スクリプトの読み込み
            if (!aframeScriptLoaded.current) {
                const aframeScript = document.createElement('script');
                aframeScript.src = 'https://aframe.io/releases/1.2.0/aframe.min.js';
                aframeScript.async = true;
                aframeScript.onload = () => {
                    console.log('A-Frame スクリプトが読み込まれました');
                    aframeScriptLoaded.current = true;

                    // AR.js スクリプトの読み込み (A-Frameの後)
                    if (!arjsScriptLoaded.current) {
                        const arjsScript = document.createElement('script');
                        arjsScript.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
                        arjsScript.async = true;
                        arjsScript.onload = () => {
                            console.log('AR.js スクリプトが読み込まれました');
                            arjsScriptLoaded.current = true;

                            // 両方のスクリプトが読み込まれた後、iframeを作成
                            createARIframe();
                        };
                        document.head.appendChild(arjsScript);
                    }
                };
                document.head.appendChild(aframeScript);
            }
        };

        loadScripts();
    }, []);

    // AR用のiframeを作成
    const createARIframe = () => {
        if (!containerRef.current) return;

        // 既存のiframeをクリア
        containerRef.current.innerHTML = '';

        // iframeを作成
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.allow = 'camera; microphone; accelerometer; gyroscope';

        containerRef.current.appendChild(iframe);

        // iframe内のドキュメントにARシーンを構築
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // HTML構造を作成
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AR Experience</title>
                <script src="https://aframe.io/releases/1.2.0/aframe.min.js"></script>
                <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"></script>
                <style>
                    body { margin: 0; overflow: hidden; }
                    .a-enter-vr { display: none; }
                </style>
                <script>
                    // 親ウィンドウとの通信
                    function handleBoxClick(index) {
                        window.parent.postMessage({ type: 'box-click', index: index }, '*');
                    }
                    
                    // GLTFのローディングエラーをハンドル
                    AFRAME.registerComponent('model-error', {
                        init: function() {
                            this.el.addEventListener('model-error', function(e) {
                                console.error('モデルの読み込みに失敗:', e.detail);
                            });
                        }
                    });
                </script>
            </head>
            <body>
                <a-scene
                    embedded
                    arjs="sourceType: webcam; debugUIEnabled: true; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
                    vr-mode-ui="enabled: false"
                    renderer="logarithmicDepthBuffer: true;"
                    loading-screen="enabled: false">
                    
                    <a-assets>
                        <a-asset-item id="ghost-model" src="/models/ghost.glb"></a-asset-item>
                        <a-asset-item id="chest-model" src="/models/chest.glb"></a-asset-item>
                    </a-assets>
                    
                    <a-entity camera position="0 0 0" look-controls="enabled: false"></a-entity>
                    
                    <a-marker preset="hiro">
                        ${monsterProximity > 0 ? `
                            <a-entity 
                                position="0 ${1 + monsterProximity / 100} -${3 - monsterProximity / 50}"
                                scale="0.5 0.5 0.5"
                                rotation="0 0 0">
                                <a-entity
                                    gltf-model="#ghost-model"
                                    model-error
                                    animation="property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true">
                                </a-entity>
                            </a-entity>
                        ` : ''}
                        
                        ${treasureBoxes.map((box, index) => !box.found ? `
                            <a-entity 
                                position="${box.x} ${box.y} ${box.z}"
                                scale="0.5 0.5 0.5"
                                rotation="0 0 0"
                                data-index="${index}"
                                onclick="handleBoxClick(${index})">
                                <a-entity
                                    gltf-model="#chest-model"
                                    model-error
                                    animation="property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true">
                                </a-entity>
                            </a-entity>
                        ` : '').join('')}
                    </a-marker>
                </a-scene>
            </body>
            </html>
        `);
        iframeDoc.close();

        // iframeの読み込み完了を監視
        iframe.onload = () => {
            console.log('ARシーンが読み込まれました');
            setIsSceneLoaded(true);
        };

        // 5秒後にタイムアウト
        setTimeout(() => {
            setIsSceneLoaded(true);
        }, 5000);
    };

    // 宝箱クリックイベントのリスナー
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'box-click') {
                dispatch(findTreasure(event.data.index));
                console.log(`宝箱 ${event.data.index} がクリックされました`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [dispatch]);

    // 状態が変わったらiframeを更新
    useEffect(() => {
        if (aframeScriptLoaded.current && arjsScriptLoaded.current) {
            createARIframe();
        }
    }, [monsterProximity, treasureBoxes]);

    return (
        <>
            <div
                ref={containerRef}
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
                    zIndex: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '20px',
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    ARシーンを読み込み中...
                    <div style={{ marginTop: '10px', fontSize: '0.8em' }}>
                        カメラの初期化に時間がかかっている場合があります
                    </div>
                </div>
            )}
        </>
    );
};

export default ARSceneManager; 