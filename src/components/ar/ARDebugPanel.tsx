import React from 'react';
import { useDispatch } from 'react-redux';
import { findTreasure } from '../../store/gameSlice';

interface ARDebugPanelProps {
    treasureBoxes: Array<{ x: number, y: number, z: number, found: boolean }>;
    debugInfo: string;
}

/**
 * ARデバッグパネルコンポーネント
 */
const ARDebugPanel: React.FC<ARDebugPanelProps> = ({ treasureBoxes, debugInfo }) => {
    const dispatch = useDispatch();

    // 未発見の宝箱を発見状態にする関数
    const findNextTreasure = () => {
        const index = treasureBoxes.findIndex(box => !box.found);
        if (index !== -1) {
            console.log(`【テスト】手動で宝箱${index}を発見状態に設定します`);
            dispatch(findTreasure(index));
        } else {
            console.log('すべての宝箱が既に発見済みです');
        }
    };

    return (
        <>
            {/* デバッグ情報表示 */}
            <div
                style={{
                    position: 'fixed',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '5px',
                    fontSize: '10px',
                    borderRadius: '5px',
                    maxWidth: '200px',
                    wordBreak: 'break-all',
                    zIndex: 9999
                }}
            >
                {debugInfo}
            </div>

            {/* デバッグボタン */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 9999
                }}
            >
                <button
                    onClick={findNextTreasure}
                    style={{
                        padding: '8px',
                        backgroundColor: 'rgba(255, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '12px'
                    }}
                >
                    テスト: 次の宝箱を発見
                </button>
            </div>
        </>
    );
};

export default ARDebugPanel; 