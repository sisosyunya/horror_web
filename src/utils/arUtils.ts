/**
 * AR関連のユーティリティ関数を提供します
 */

/**
 * 宝箱を発見したときの視覚的フィードバックを表示します
 * @param foundCount 発見済みの宝箱数
 * @param totalCount 全宝箱数
 */
export const showTreasureFoundEffect = (foundCount: number, totalCount: number) => {
    const progress = Math.round((foundCount / totalCount) * 100);
    console.log(`宝箱発見エフェクト表示 - 進行状況: ${foundCount}/${totalCount} (${progress}%)`);

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
    overlay.style.zIndex = '999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.transition = 'opacity 1s ease-out';

    const message = document.createElement('div');
    message.textContent = '宝箱を発見！';
    message.style.color = 'white';
    message.style.fontSize = '2em';
    message.style.fontWeight = 'bold';
    message.style.textShadow = '0 0 10px black';
    message.style.padding = '20px';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    message.style.borderRadius = '10px';
    message.style.textAlign = 'center';
    message.style.marginBottom = '10px';

    const progressInfo = document.createElement('div');
    progressInfo.textContent = `進行状況: ${foundCount}/${totalCount} (${progress}%)`;
    progressInfo.style.color = 'white';
    progressInfo.style.fontSize = '1.5em';
    progressInfo.style.fontWeight = 'bold';
    progressInfo.style.textShadow = '0 0 10px black';
    progressInfo.style.padding = '10px 20px';
    progressInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    progressInfo.style.borderRadius = '10px';
    progressInfo.style.marginTop = '10px';

    overlay.appendChild(message);
    overlay.appendChild(progressInfo);
    document.body.appendChild(overlay);

    // フェードアウト
    setTimeout(() => {
        overlay.style.opacity = '0';
    }, 1200);

    // 削除
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 2200);
};

/**
 * A-Frameのスクリプトを動的に読み込みます
 * @returns Promise<{aframeLoaded: boolean, arjsLoaded: boolean}>
 */
export const loadARScripts = (): Promise<{ aframeLoaded: boolean, arjsLoaded: boolean }> => {
    return new Promise((resolve) => {
        // A-Frame スクリプトの読み込み
        const aframeScript = document.createElement('script');
        aframeScript.src = 'https://aframe.io/releases/1.2.0/aframe.min.js';
        aframeScript.async = true;
        aframeScript.onload = () => {
            console.log('A-Frame スクリプトが読み込まれました');

            // AR.js スクリプトの読み込み (A-Frameの後)
            const arjsScript = document.createElement('script');
            arjsScript.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
            arjsScript.async = true;
            arjsScript.onload = () => {
                console.log('AR.js スクリプトが読み込まれました');
                resolve({ aframeLoaded: true, arjsLoaded: true });
            };
            document.head.appendChild(arjsScript);
        };
        document.head.appendChild(aframeScript);
    });
};

/**
 * ARシーン用のHTMLコンテンツを生成します
 * @param monsterProximity モンスターの接近度
 * @param treasureBoxes 宝箱の配列
 * @param foundCount 発見済みの宝箱数
 * @param totalCount 全宝箱数
 * @returns ARシーン用のHTML
 */
export const generateARSceneHTML = (
    monsterProximity: number,
    treasureBoxes: Array<{ x: number, y: number, z: number, found: boolean }>,
    foundCount: number,
    totalCount: number
): string => {
    const progress = Math.round((foundCount / totalCount) * 100);

    return `
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
                .found-treasure {
                    animation: pulse 1s infinite alternate;
                }
                @keyframes pulse {
                    from { opacity: 0.7; }
                    to { opacity: 1; }
                }
                #progress-notification {
                    position: fixed;
                    bottom: 70px;
                    left: 20px;
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    z-index: 999;
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                #progress-notification.show {
                    opacity: 1;
                }
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
                            
                            // クリック効果
                            this.el.setAttribute('animation', 'property: scale; to: 0.6 0.6 0.6; dur: 500; easing: easeInOutCubic');
                            
                            // モデルに発見エフェクトを追加
                            const model = this.el.querySelector('[gltf-model]');
                            if (model) {
                                model.classList.add('found-treasure');
                            }
                            
                            // 進行状況の通知
                            showProgressNotification();
                        });
                        
                        // タッチデバイス用
                        this.el.addEventListener('touchend', () => {
                            console.log('宝箱タッチ: ' + this.data.index);
                            window.parent.postMessage({ 
                                type: 'box-click', 
                                index: this.data.index 
                            }, '*');
                            
                            // タッチ効果
                            this.el.setAttribute('animation', 'property: scale; to: 0.6 0.6 0.6; dur: 500; easing: easeInOutCubic');
                            
                            // モデルに発見エフェクトを追加
                            const model = this.el.querySelector('[gltf-model]');
                            if (model) {
                                model.classList.add('found-treasure');
                            }
                            
                            // 進行状況の通知
                            showProgressNotification();
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
                
                // 進行状況通知を表示する関数
                function showProgressNotification() {
                    let notification = document.getElementById('progress-notification');
                    if (!notification) {
                        notification = document.createElement('div');
                        notification.id = 'progress-notification';
                        document.body.appendChild(notification);
                    }
                    
                    // 現在の状態を親ウィンドウから取得（メッセージングがあるため少し遅延）
                    setTimeout(() => {
                        notification.textContent = '宝箱を発見しました！';
                        notification.classList.add('show');
                        
                        setTimeout(() => {
                            notification.classList.remove('show');
                        }, 3000);
                    }, 300);
                }
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
                
                // 進行状況表示の初期化
                window.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'progress-update') {
                        const notification = document.getElementById('progress-notification');
                        if (notification) {
                            notification.textContent = '進行状況: ' + event.data.foundCount + '/' + event.data.totalCount + ' (' + event.data.progress + '%)';
                            notification.classList.add('show');
                            
                            setTimeout(() => {
                                notification.classList.remove('show');
                            }, 3000);
                        }
                    }
                });
                
                // 初期進行状況を表示
                const initialProgress = document.createElement('div');
                initialProgress.textContent = '現在の進行状況: ${foundCount}/${totalCount} (${progress}%)';
                initialProgress.style.position = 'fixed';
                initialProgress.style.bottom = '20px';
                initialProgress.style.left = '20px';
                initialProgress.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                initialProgress.style.color = 'white';
                initialProgress.style.padding = '10px';
                initialProgress.style.borderRadius = '5px';
                initialProgress.style.fontFamily = 'Arial, sans-serif';
                initialProgress.style.fontSize = '14px';
                initialProgress.style.zIndex = '999';
                document.body.appendChild(initialProgress);
                
                // 3秒後に初期進行状況を非表示
                setTimeout(() => {
                    initialProgress.style.opacity = '0';
                    initialProgress.style.transition = 'opacity 1s ease';
                    setTimeout(() => {
                        document.body.removeChild(initialProgress);
                    }, 1000);
                }, 3000);
            </script>
        </body>
        </html>
    `;
}; 