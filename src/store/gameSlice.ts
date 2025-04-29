import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TreasureBox {
    x: number;
    y: number;
    z: number;
    found: boolean;
}

interface GameState {
    monsterProximity: number;
    treasureBoxes: TreasureBox[];
    isGameStarted: boolean;
    lastFoundTreasure: number | null;
}

const initialState: GameState = {
    monsterProximity: 0,
    treasureBoxes: [
        { x: 1, y: 0, z: -2, found: false },
        { x: -1, y: 0, z: -2, found: false },
        { x: 0, y: 0, z: -3, found: false }
    ],
    isGameStarted: false,
    lastFoundTreasure: null
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        activateMonster: (state) => {
            state.monsterProximity = Math.min(state.monsterProximity + 100, 200);
            console.log('モンスター接近度UP:', state.monsterProximity);
        },
        deactivateMonster: (state) => {
            state.monsterProximity = Math.max(state.monsterProximity - 5, 0);
        },
        forceShowMonster: (state) => {
            state.monsterProximity = 150;
            console.log('モンスターを強制表示:', state.monsterProximity);
        },
        forceHideMonster: (state) => {
            state.monsterProximity = 0;
            console.log('モンスターを強制非表示');
        },
        updateDistance: (state, action: PayloadAction<number>) => {
            state.monsterProximity = Math.max(0, state.monsterProximity - action.payload / 2);
        },
        findTreasure: (state, action: PayloadAction<number>) => {
            const index = action.payload;
            if (index >= 0 && index < state.treasureBoxes.length) {
                console.log(`【gameSlice】宝箱 ${index} を見つけました`);

                // 更新前の状態を表示
                console.log('【gameSlice】更新前の宝箱の状態:', JSON.stringify(state.treasureBoxes));

                // 直接変更する代わりに新しい配列を作成して代入
                const updatedTreasureBoxes = state.treasureBoxes.map((box, i) =>
                    i === index ? { ...box, found: true } : box
                );

                // 状態を完全に置き換える
                state.treasureBoxes = updatedTreasureBoxes;
                state.lastFoundTreasure = index;

                // 更新後の状態を表示
                console.log('【gameSlice】更新後の宝箱の状態:', JSON.stringify(state.treasureBoxes));
                console.log('【gameSlice】見つかった宝箱の数:', state.treasureBoxes.filter(box => box.found).length);
            } else {
                console.error(`【gameSlice】無効な宝箱のインデックス: ${index}`);
            }
        },
        startGame: (state) => {
            state.isGameStarted = true;
        },
        resetTreasures: (state) => {
            state.treasureBoxes = state.treasureBoxes.map(box => ({ ...box, found: false }));
            state.lastFoundTreasure = null;
        }
    }
});

export const {
    activateMonster,
    deactivateMonster,
    forceShowMonster,
    forceHideMonster,
    updateDistance,
    findTreasure,
    startGame,
    resetTreasures
} = gameSlice.actions;
export default gameSlice.reducer; 