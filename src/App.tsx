import React from 'react';
import { Provider } from 'react-redux';
import ARScene from './components/ARScene';
import { store } from './store/store';
import './App.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="App">
        <ARScene />
      </div>
    </Provider>
  );
};

export default App;
