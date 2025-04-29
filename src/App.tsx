import React from 'react';
import { Provider } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Container } from '@mui/material';
import ARScene from './components/ARScene';
import { store } from './store/store';
import { activateMonster } from './store/gameSlice';
import type { RootState } from './store/store';
import './App.css';

const GameUI: React.FC = () => {
  const dispatch = useDispatch();
  const { monsterProximity } = useSelector((state: RootState) => state.game);

  const handleSoundDetected = () => {
    dispatch(activateMonster());
  };

  return (
    <Container>
      <Box sx={{ position: 'fixed', top: 20, left: 20, zIndex: 1000 }}>
        {monsterProximity > 0 && (
          <Typography variant="h6" color="red">
            ！危険！モンスターが接近中
          </Typography>
        )}
      </Box>
      <ARScene onSoundDetected={handleSoundDetected} />
    </Container>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="App">
        <ARScene onSoundDetected={() => { }} />
      </div>
    </Provider>
  );
};

export default App;
