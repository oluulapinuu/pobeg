import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { PointerLockControls } from '@react-three/drei';
import { Player } from './Player';
import { Level } from './Level';
import { Voenkom } from './Voenkom';
import { useGameStore } from '../store';

export const Game: React.FC = () => {
  const { gameStarted, isGameOver, isVictory } = useGameStore();

  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows camera={{ fov: 75 }}>
        <Physics gravity={[0, -9.81, 0]}>
          <Player />
          <Level />
          <Voenkom />
        </Physics>
        
        {/* Enable controls if game started and NOT game over. Victory allows movement. */}
        {gameStarted && (!isGameOver || isVictory) && (
           <PointerLockControls />
        )}
      </Canvas>
    </div>
  );
};