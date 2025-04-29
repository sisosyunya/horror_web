import React from 'react';
import { useDispatch } from 'react-redux';
import { startGame } from '../store/gameSlice';

const GameStart: React.FC = () => {
    const dispatch = useDispatch();

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
            textAlign: 'center'
        }}>
            <h1 style={{
                fontSize: '2em',
                marginBottom: '20px',
                color: '#FFD700'
            }}>
                ホラメンテ
            </h1>
            <div style={{
                maxWidth: '600px',
                marginBottom: '30px',
                lineHeight: '1.6'
            }}>
                <h2 style={{ color: '#FFD700', marginBottom: '15px' }}>ゲームのルール</h2>
                <p style={{ marginBottom: '10px' }}>
                    1. 静かに移動して、宝箱を探してください。
                </p>
                <p style={{ marginBottom: '10px' }}>
                    2. 大きな音を立てると、モンスターが現れます。
                </p>
                <p style={{ marginBottom: '10px' }}>
                    3. モンスターが近づいてきたら、静かに逃げましょう。
                </p>
                <p style={{ marginBottom: '10px' }}>
                    4. 宝箱を見つけたら、タップして開けてください。
                </p>
                <p style={{ marginBottom: '10px' }}>
                    5. すべての宝箱を見つけるとゲームクリアです。
                </p>
            </div>
            <button
                onClick={() => dispatch(startGame())}
                style={{
                    padding: '15px 40px',
                    fontSize: '1.2em',
                    backgroundColor: '#FFD700',
                    color: '#000',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, background-color 0.2s',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.backgroundColor = '#FFE44D';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#FFD700';
                }}
            >
                ゲームスタート
            </button>
        </div>
    );
};

export default GameStart; 