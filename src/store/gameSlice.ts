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
}

const initialState: GameState = {
    monsterProximity: 0,
    treasureBoxes: [
        { x: 1, y: 0, z: -2, found: false },
        { x: -1, y: 0, z: -2, found: false },
        { x: 0, y: 0, z: -3, found: false }
    ],
    isGameStarted: false
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        activateMonster: (state) => {
            state.monsterProximity = Math.min(state.monsterProximity + 50, 200);
        },
        deactivateMonster: (state) => {
            state.monsterProximity = Math.max(state.monsterProximity - 10, 0);
        },
        updateDistance: (state, action: PayloadAction<number>) => {
            state.monsterProximity = Math.max(0, state.monsterProximity - action.payload);
        },
        findTreasure: (state, action: PayloadAction<number>) => {
            state.treasureBoxes[action.payload].found = true;
        },
        startGame: (state) => {
            state.isGameStarted = true;
        }
    }
});

export const { activateMonster, deactivateMonster, updateDistance, findTreasure, startGame } = gameSlice.actions;
export default gameSlice.reducer; 