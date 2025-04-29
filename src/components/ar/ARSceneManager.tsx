import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { loadARScripts, generateARSceneHTML } from '../../utils/arUtils';
import { TreasureBoxManager } from './TreasureBoxManager';
import ARDebugPanel from './ARDebugPanel';

interface ARSceneManagerProps {
    cameraStream: MediaStream | null;
}

/**
 * ARシーンを管理するコンポーネント
 */
const ARSceneManager: React.FC<ARSceneManagerProps> = ({ cameraStream }) => {
    const dispatch = useDispatch();
    const { monsterProximity, treasureBoxes } = useSelector((state: RootState) => state.game);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSceneLoaded, setIsSceneLoaded] = useState(false);
    const aframeScriptLoaded = useRef(false);
    const arjsScriptLoaded = useRef(false);
    const [debugInfo, setDebugInfo] = useState('');

    // 宝箱マネージャーをRef として保持
    const treasureBoxManagerRef = useRef<TreasureBoxManager | null>(null);

    // 初期化時に宝箱マネージャーを作成
    useEffect(() => {
        treasureBoxManagerRef.current = new TreasureBoxManager(dispatch, treasureBoxes);
    }, [dispatch]);

    // 宝箱の状態が変更されたら、宝箱マネージャーを更新
    useEffect(() => {
        if (treasureBoxManagerRef.current) {
            treasureBoxManagerRef.current.updateTreasureBoxes(treasureBoxes);
        }

        // デバッグ情報を更新
        console.log('見つかった宝箱の数:', treasureBoxes.filter(box => box.found).length);
        setDebugInfo(`最終更新: ${new Date().toLocaleTimeString()}, 宝箱: ${JSON.stringify(treasureBoxes.map(box => box.found))}`);
    }, [treasureBoxes]);

    // スクリプトの読み込み
    useEffect(() => {
        if (aframeScriptLoaded.current && arjsScriptLoaded.current) return;

        const initScripts = async () => {
            try {
                const { aframeLoaded, arjsLoaded } = await loadARScripts();
                aframeScriptLoaded.current = aframeLoaded;
                arjsScriptLoaded.current = arjsLoaded;

                // 両方のスクリプトが読み込まれた後、ARシーンを作成
                if (aframeLoaded && arjsLoaded) {
                    createARIframe();
                }
            } catch (error) {
                console.error('ARスクリプトの読み込みに失敗しました:', error);
            }
        };

        initScripts();
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

        // 現在の進行状況を計算
        const foundCount = treasureBoxes.filter(box => box.found).length;
        const totalCount = treasureBoxes.length;

        // HTML構造を作成
        const arSceneHTML = generateARSceneHTML(
            monsterProximity,
            treasureBoxes,
            foundCount,
            totalCount
        );

        iframeDoc.open();
        iframeDoc.write(arSceneHTML);
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
            // 宝箱マネージャーがあればイベント処理を委譲
            if (treasureBoxManagerRef.current) {
                treasureBoxManagerRef.current.handleMessage(event, containerRef);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [treasureBoxes]);

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

            {/* デバッグパネル */}
            <ARDebugPanel treasureBoxes={treasureBoxes} debugInfo={debugInfo} />
        </>
    );
};

export default ARSceneManager; 