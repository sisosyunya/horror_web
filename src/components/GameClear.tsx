import React from 'react';
import { useDispatch } from 'react-redux';
import { resetTreasures, startGame } from '../store/gameSlice';

const GameClear: React.FC = () => {
    const dispatch = useDispatch();

    const handleRestart = () => {
        dispatch(resetTreasures());
        // 少し遅延させてからゲームを再開
        setTimeout(() => {
            dispatch(startGame());
        }, 500);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            color: 'white',
            textAlign: 'center',
            animation: 'fadeIn 1s ease-in-out'
        }}>
            <div style={{
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                opacity: 0,
                transform: 'scale(0.8)'
            }}>
                <h1 style={{
                    fontSize: '3em',
                    marginBottom: '20px',
                    color: '#4CAF50',
                    textShadow: '0 0 15px rgba(76, 175, 80, 0.7)'
                }}>
                    ゲームクリア！
                </h1>

                <div style={{
                    fontSize: '6em',
                    margin: '30px 0',
                    animation: 'pulse 2s infinite'
                }}>
                    🏆
                </div>

                <div style={{
                    maxWidth: '600px',
                    marginBottom: '30px',
                    lineHeight: '1.6'
                }}>
                    <h2 style={{ color: '#FFD700', marginBottom: '15px' }}>おめでとうございます！</h2>
                    <p style={{ marginBottom: '20px', fontSize: '1.2em' }}>
                        あなたは全ての宝箱を見つけることができました！
                    </p>
                    <p style={{ marginBottom: '30px' }}>
                        再チャレンジしてより速くクリアしましょう！
                    </p>
                </div>

                <button
                    onClick={handleRestart}
                    style={{
                        padding: '15px 40px',
                        fontSize: '1.2em',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, background-color 0.2s',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.backgroundColor = '#45a049';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = '#4CAF50';
                    }}
                >
                    もう一度プレイ
                </button>
            </div>

            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.8); }
                    70% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                `}
            </style>
        </div>
    );
};

export default GameClear; 