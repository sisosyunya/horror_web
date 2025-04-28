import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/gameSlice';

const GameProgress: React.FC = () => {
    const { treasureBoxes, monsterProximity } = useSelector((state: RootState) => state.game);
    const foundTreasures = treasureBoxes.filter(box => box.found).length;
    const totalTreasures = treasureBoxes.length;
    const progress = (foundTreasures / totalTreasures) * 100;

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
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: '#FFD700',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
                <p style={{ margin: '10px 0 0 0' }}>
                    宝箱: {foundTreasures}/{totalTreasures}
                </p>
            </div>
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '15px',
                borderRadius: '10px'
            }}>
                <h3 style={{ margin: '0 0 10px 0' }}>次のアクション</h3>
                {monsterProximity > 0 ? (
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