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
                    // カスタムクリックコンポーネント
                    AFRAME.registerComponent('treasure-box', {
                        schema: {
                            index: {type: 'number', default: 0}
                        },
                        init: function() {
                            this.el.addEventListener('click', () => {
                                console.log('宝箱クリック: ' + this.data.index);
                                window.parent.postMessage({ 
                                    type: 'box-click', 
                                    index: this.data.index 
                                }, '*');
                            });
                            
                            // タッチデバイス用
                            this.el.addEventListener('touchend', () => {
                                console.log('宝箱タッチ: ' + this.data.index);
                                window.parent.postMessage({ 
                                    type: 'box-click', 
                                    index: this.data.index 
                                }, '*');
                            });
                        }
                    });
                    
                    // GLTFのローディングエラーをハンドル
                    AFRAME.registerComponent('model-error', {
                        init: function() {
                            this.el.addEventListener('model-error', function(e) {
                                console.error('モデルの読み込みに失敗:', e.detail);
                            });
                        }
                    });

                    // デバッグ用：シーン読み込み完了時のイベント
                    window.addEventListener('load', function() {
                        console.log('ARシーンのDOM読み込み完了');
                    });

                    document.addEventListener('DOMContentLoaded', function() {
                        console.log('ARシーンのDOM読み込み完了');
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
                    
                    <a-entity camera position="0 0 0" look-controls="enabled: false">
                        <a-entity 
                            cursor="fuse: false; rayOrigin: mouse;"
                            raycaster="objects: .clickable; far: 100"
                            position="0 0 -1"
                            geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
                            material="color: white; shader: flat"
                            visible="false">
                        </a-entity>
                    </a-entity>
                    
                    <!-- デモ用のチェスト（マーカーなしで表示） -->
                    <a-entity 
                        position="0 0 -3"
                        scale="0.5 0.5 0.5"
                        rotation="0 0 0"
                        class="clickable"
                        treasure-box="index: 999">
                        <a-entity
                            gltf-model="#chest-model"
                            model-error
                            animation="property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true">
                        </a-entity>
                    </a-entity>
                    
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
                                class="clickable"
                                treasure-box="index: ${index}">
                                <a-entity
                                    gltf-model="#chest-model"
                                    model-error
                                    animation="property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true">
                                </a-entity>
                            </a-entity>
                        ` : '').join('')}
                    </a-marker>
                </a-scene>

                <script>
                    // デバッグ用のイベント表示
                    document.addEventListener('click', function(event) {
                        console.log('ドキュメントクリック:', event.target);
                    });
                    
                    // シーン読み込み完了時の処理
                    const scene = document.querySelector('a-scene');
                    if (scene) {
                        if (scene.hasLoaded) {
                            console.log('シーンはすでに読み込み完了しています');
                        } else {
                            scene.addEventListener('loaded', function() {
                                console.log('シーンの読み込みが完了しました');
                            });
                        }
                    }
                </script>
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
                console.log('メッセージ受信:', event.data);
                if (event.data.index === 999) {
                    console.log('デモ用宝箱がクリックされました');
                    return;
                }
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