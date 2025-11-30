import React from 'react';
import { Game } from './components/Game';
import { UI } from './components/UI';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-full">
      <Game />
      <UI />
    </div>
  );
};

export default App;
