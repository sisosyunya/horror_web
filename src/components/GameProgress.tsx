import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const GameProgress: React.FC = () => {
    const { treasureBoxes, monsterProximity } = useSelector((state: RootState) => state.game);
    const foundTreasures = treasureBoxes.filter(box => box.found).length;
    const totalTreasures = treasureBoxes.length;
    const [displayProgress, setDisplayProgress] = useState(0);
    const actualProgress = (foundTreasures / totalTreasures) * 100;
    const prevFoundTreasuresRef = useRef(0);

    // 進行状況のアニメーション
    useEffect(() => {
        let timeout: number;
        if (displayProgress < actualProgress) {
            timeout = window.setTimeout(() => {
                setDisplayProgress(prev => Math.min(prev + 1, actualProgress));
            }, 20);
        } else if (displayProgress > actualProgress) {
            setDisplayProgress(actualProgress); // 減少する場合は即時反映
        }
        return () => window.clearTimeout(timeout);
    }, [displayProgress, actualProgress]);

    // 宝箱の状態変更を監視し、進捗バーを強制的に更新
    useEffect(() => {
        // 宝箱の状態が変更された場合は、表示を更新
        if (prevFoundTreasuresRef.current !== foundTreasures) {
            console.log(`【GameProgress】見つかった宝箱の数が変更されました: ${prevFoundTreasuresRef.current} -> ${foundTreasures}`);

            // 強制的に表示を更新
            setDisplayProgress(0); // 一度リセット
            setTimeout(() => {
                setDisplayProgress(actualProgress); // 実際の進捗に設定
            }, 10);

            prevFoundTreasuresRef.current = foundTreasures;
        }
    }, [foundTreasures, actualProgress]);

    // デバッグ：状態変更時にログを出力
    useEffect(() => {
        console.log('【GameProgress】宝箱の状態が変更されました');
        console.log('見つかった宝箱:', foundTreasures);
        console.log('全宝箱数:', totalTreasures);
        console.log('進行度:', actualProgress);
        console.log('treasureBoxes:', JSON.stringify(treasureBoxes));
    }, [treasureBoxes, foundTreasures, totalTreasures, actualProgress]);

    // 強制更新用のタイマー
    useEffect(() => {
        // 3秒ごとに現在の状態を確認し、必要に応じて更新
        const intervalId = setInterval(() => {
            console.log('【GameProgress】定期チェック - 現在の進行状況:', actualProgress);
            // 表示がずれている場合は強制更新
            if (Math.abs(displayProgress - actualProgress) > 1) {
                console.log('【GameProgress】表示と実際の進捗にずれがあるため強制更新します');
                setDisplayProgress(actualProgress);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [displayProgress, actualProgress]);

    // 進行状況に応じたカラーとメッセージ
    const getProgressColor = () => {
        if (displayProgress >= 100) return '#4CAF50'; // 完了 (緑)
        if (displayProgress >= 70) return '#8BC34A';  // 70%以上 (薄緑)
        if (displayProgress >= 40) return '#FFEB3B';  // 40%以上 (黄色)
        return '#FFD700';                            // デフォルト (金色)
    };

    // 宝箱の発見状態を表示するデバッグ情報
    const treasureDebugInfo = treasureBoxes.map((box, i) =>
        `宝箱${i + 1}: ${box.found ? '✓' : '✗'}`
    ).join(', ');

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            left: 20,
            right: 20,
            zIndex: 2,
            color: 'white',
            textShadow: '0 0 5px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '10px'
            }}>
                <h3 style={{ margin: '0 0 10px 0' }}>ゲームの進行状況</h3>
                <div style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        width: `${displayProgress}%`,
                        height: '100%',
                        backgroundColor: getProgressColor(),
                        transition: 'width 0.3s ease, background-color 0.5s ease',
                        boxShadow: displayProgress === 100 ? '0 0 10px #4CAF50' : 'none',
                        borderRadius: '10px'
                    }} />

                    {/* 進行度テキスト */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.8em',
                        fontWeight: 'bold',
                        textShadow: '0 0 3px black'
                    }}>
                        {Math.round(displayProgress)}%
                    </div>

                    {/* 宝箱アイコン表示 */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                        pointerEvents: 'none'
                    }}>
                        {treasureBoxes.map((box, i) => (
                            <div key={i} style={{
                                fontSize: '0.8em',
                                color: box.found ? '#FFD700' : 'rgba(255, 255, 255, 0.3)',
                                fontWeight: 'bold',
                                transform: box.found ? 'scale(1.2)' : 'scale(1)',
                                transition: 'all 0.3s ease',
                                textShadow: box.found ? '0 0 5px #FFD700' : 'none'
                            }}>
                                💎
                            </div>
                        ))}
                    </div>
                </div>
                <p style={{ margin: '10px 0 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>宝箱: {foundTreasures}/{totalTreasures}</span>
                    <span style={{
                        fontSize: '0.8em',
                        color: displayProgress === 100 ? '#4CAF50' : '#AAA',
                        fontWeight: displayProgress === 100 ? 'bold' : 'normal',
                        transition: 'color 0.5s ease'
                    }}>
                        {displayProgress === 100 ? '全ての宝箱を発見しました！' : '宝箱を探索中...'}
                    </span>
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: '#AAA' }}>
                    {treasureBoxes.map((box, i) =>
                        <span key={i} style={{
                            marginRight: '10px',
                            color: box.found ? '#4CAF50' : '#AAA',
                            transition: 'color 0.3s ease'
                        }}>
                            宝箱{i + 1}: {box.found ? '✓' : '✗'}
                        </span>
                    )}
                </p>

                {/* デバッグ情報 */}
                <p style={{ margin: '5px 0 0 0', fontSize: '0.7em', color: '#888', borderTop: '1px solid #444', paddingTop: '5px' }}>
                    デバッグ: 実際={Math.round(actualProgress)}%, 表示={Math.round(displayProgress)}%,
                    状態=[{treasureDebugInfo}]
                </p>
            </div>
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '15px',
                borderRadius: '10px'
            }}>
                <h3 style={{ margin: '0 0 10px 0' }}>次のアクション</h3>
                {displayProgress === 100 ? (
                    <p style={{ color: '#4CAF50', margin: 0 }}>
                        おめでとうございます！全ての宝箱を見つけました！
                    </p>
                ) : monsterProximity > 0 ? (
                    <p style={{ color: '#FF4444', margin: 0 }}>
                        モンスターが近づいています！静かに逃げましょう。
                    </p>
                ) : (
                    <p style={{ margin: 0 }}>
                        宝箱を探して、タップして開けてください。
                    </p>
                )}
            </div>
        </div>
    );
};

export default GameProgress; 