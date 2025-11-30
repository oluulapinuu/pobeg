

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { audioService } from '../services/audioService';

const ACCEPT_PHRASES = ["Без истерик? Уважаю. Сейчас подпишешь — и сразу в мясорубку, красавчик","Добровольно? Ну всё, пацан, ты уже труп. Только тёпленький пока","Смотри-ка, сам повесточку взял… Прям гордость берёт. Через месяц будешь в цинке фоткаться","Открыл без скандала? Молодец, сэкономил мне время. Теперь спокойно поедешь удобрять поле","О, сознательный! Люблю таких. Быстро собрался — быстро сгнил, всё по расписанию","Сам пришёл? Без мамкиных слёз? Ну всё, братан, ты уже легенда… посмертно","Какой воспитанный. Прям слеза прошибает. Сейчас в окоп — и слёз будет море, только чужих","Без сопротивления? Красавчик. Значит точно до фронта доедешь… дальше уже как повезёт","Сам открыл, сам взял… Прям идеальный клиент. Поебаться не успел — уже в списках на 200-е","Идеально. Никакого нытья. Только покорность. Окопам такие нравятся."];

export const UI: React.FC = () => {
  const { 
    playerHp, 
    inventory,
    activeSlot,
    ammo, 
    message, 
    isGameOver, 
    isVictory, 
    gameStarted, 
    startGame,
    interactionText,
    detentionTime,
    lookingThroughPeephole,
    showPovestka,
    acceptPovestka,
    rejectPovestka
  } = useGameStore();

  const [wakingUp, setWakingUp] = useState(false);

  const handleStart = () => {
    audioService.init(); 
    startGame();
    setWakingUp(true);
    setTimeout(() => setWakingUp(false), 2000);
    setTimeout(() => {
        const doc = (window as any).document;
        const canvas = doc.querySelector('canvas');
        canvas?.requestPointerLock();
    }, 100);
  };

  useEffect(() => {
      const handleKey = (e: any) => {
          if (showPovestka) {
              e.stopPropagation();
              e.preventDefault();
              if (e.code === 'KeyY') {
                  useGameStore.getState().setShowPovestka(false);
                  const randomPhrase = ACCEPT_PHRASES[Math.floor(Math.random() * ACCEPT_PHRASES.length)];
                  audioService.speak(randomPhrase, 1, 1, 0.2);
                  const phraseDuration = audioService.getDuration(randomPhrase);
                  
                  setTimeout(() => {
                      audioService.speak("Свежее мясо на фронт.", 1, 0.9, 0.1);
                      setTimeout(() => {
                          audioService.playMusic('https://cdn.jsdelivr.net/gh/oluulapinuu/vv@main/loh.mp3');
                          acceptPovestka();
                      }, 2500);
                  }, phraseDuration + 1000);
              }
              if (e.code === 'KeyN') {
                  rejectPovestka();
              }
          }
      }
      (window as any).addEventListener('keydown', handleKey, true);
      return () => (window as any).removeEventListener('keydown', handleKey, true);
  }, [showPovestka, acceptPovestka, rejectPovestka]);

  if (!gameStarted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-white flex-col z-50">
        <h1 className="text-4xl font-bold mb-4 text-red-600">ПОБЕГ ОТ ВОЕНКОМА</h1>
        <p className="mb-4 max-w-md text-center">Ты в своей квартире. Военком ждет снаружи.</p>
        <button onClick={handleStart} className="px-6 py-3 bg-red-700 hover:bg-red-600 rounded text-xl font-bold mb-6">НАЧАТЬ ИГРУ</button>
        <div className="text-sm text-gray-400 font-mono text-left max-w-xs">
            <p><span className="font-bold text-white">WASD:</span> Ходить</p>
            <p><span className="font-bold text-white">SHIFT:</span> Бег</p>
            <p><span className="font-bold text-white">C:</span> Присесть</p>
            <p><span className="font-bold text-white">F:</span> Взаимодействие (Дверь, Глазок)</p>
            <p><span className="font-bold text-white">G:</span> Подобрать / Выбросить предмет</p>
            <p><span className="font-bold text-white">ЛКМ:</span> Атака</p>
            <p><span className="font-bold text-white">1-9:</span> Смена оружия</p>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 text-white flex-col z-50">
        <h1 className="text-6xl font-bold mb-4">ТЫ В АРМИИ</h1>
        <p className="text-2xl mb-8">{message}</p>
        <button onClick={() => (window as any).location.reload()} className="px-6 py-3 border-2 border-white hover:bg-white hover:text-black rounded">ПОПРОБОВАТЬ СНОВА</button>
      </div>
    );
  }

  return (
    <>
      <div className={`pointer-events-none fixed inset-0 bg-black z-50 transition-opacity duration-[2000ms] ease-in-out ${wakingUp ? 'opacity-100' : 'opacity-0'}`} />
      <div className="crosshair" />
      {lookingThroughPeephole && <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 35%, black 85%)', backdropFilter: 'blur(1px)'}} />}
      
      {showPovestka && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black bg-opacity-40">
              <div className="bg-white p-4 w-[350px] h-[450px] text-black shadow-2xl flex flex-col items-center rotate-1">
                  <h2 className="text-xl font-bold mb-2 uppercase border-b-2 border-black w-full text-center">ПОВЕСТКА</h2>
                  <div className="text-xs font-serif mb-2 flex-grow text-justify">В соответствии с Федеральным законом «О воинской обязанности и военной службе» Вы, гражданин Додик, обязаны явиться в военный комиссариат для прохождения медицинской комиссии.<br/><br/><span className="font-bold text-lg block text-center mt-4">ВЫ НУЖНЫ НАМ.</span></div>
                  <div className="flex gap-2 w-full justify-between mt-2"><div className="bg-red-600 text-white px-3 py-1 font-bold cursor-pointer hover:bg-red-500">[N] ОТКАЗ</div><div className="bg-green-700 text-white px-3 py-1 font-bold cursor-pointer hover:bg-green-600">[Y] ПРИНЯТЬ</div></div>
              </div>
          </div>
      )}

      {interactionText && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-8 text-white text-base font-bold drop-shadow-md pointer-events-none bg-black bg-opacity-50 px-2 rounded">{interactionText}</div>}

      {detentionTime > 0 && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-48 h-4 bg-gray-800 border border-red-500 rounded pointer-events-none">
              <div className="h-full bg-red-600 transition-all duration-100 ease-linear" style={{ width: `${(detentionTime / 5) * 100}%` }}/>
              <span className="absolute inset-0 text-center text-[10px] font-bold text-white leading-4">ЗАДЕРЖАНИЕ...</span>
          </div>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <span className={`${isVictory ? 'bg-green-700' : 'bg-black'} bg-opacity-50 text-white px-3 py-1 rounded text-sm font-bold`}>{message}</span>
      </div>
      
      <div className="absolute bottom-16 left-4 text-white font-mono pointer-events-none select-none">
          <div className="w-40 h-6 bg-gray-900 border-2 border-white rounded-sm overflow-hidden"><div className="h-full bg-red-600 transition-all" style={{ width: `${playerHp}%` }} /></div>
          <div className="text-red-500 font-bold text-xl drop-shadow-lg" style={{textShadow: '1px 1px 2px black'}}>HP: {playerHp}</div>
      </div>

      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 p-1 bg-gray-900 bg-opacity-70 rounded pointer-events-none">
         {inventory.map((item, idx) => (
             <div key={idx} className={`w-10 h-10 border-2 flex items-center justify-center relative ${activeSlot === idx ? 'border-yellow-400 bg-gray-700' : 'border-gray-600 bg-black'}`}>
                 {item === 'glock' && <span className="text-xl">🔫</span>}
                 {item === 'axe' && <span className="text-xl">🪓</span>}
                 {item === 'bat' && <span className="text-xl">🏏</span>}
                 {item === 'machete' && <span className="text-xl">🗡️</span>}
                 {item === 'fist' && <span className="text-xl opacity-20">✊</span>}
                 {item === 'glock' && <span className="absolute bottom-0 right-1 text-[10px] text-blue-300 font-bold">{ammo}</span>}
                 <span className="absolute top-0 left-1 text-[9px] text-gray-400">{idx + 1}</span>
             </div>
         ))}
      </div>
    </>
  );
};
