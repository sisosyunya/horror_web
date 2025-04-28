import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GameState {
    isMonsterActive: boolean;
    playerHealth: number;
    score: number;
}

const initialState: GameState = {
    isMonsterActive: false,
    playerHealth: 100,
    score: 0,
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        activateMonster: (state) => {
            state.isMonsterActive = true;
        },
        deactivateMonster: (state) => {
            state.isMonsterActive = false;
        },
        decreaseHealth: (state, action: PayloadAction<number>) => {
            state.playerHealth = Math.max(0, state.playerHealth - action.payload);
        },
        increaseScore: (state, action: PayloadAction<number>) => {
            state.score += action.payload;
        },
        resetGame: (state) => {
            state.isMonsterActive = false;
            state.playerHealth = 100;
            state.score = 0;
        },
    },
});

export const {
    activateMonster,
    deactivateMonster,
    decreaseHealth,
    increaseScore,
    resetGame,
} = gameSlice.actions;

export default gameSlice.reducer; 