
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../store';
import { audioService } from '../services/audioService';
import { CustomVoenkom } from './Models';

// Physics Groups
const GROUP_SCENE = 1;
const GROUP_PLAYER = 2;
const GROUP_VOENKOM = 8;

// Death phrases
const DEATH_PHRASES = [
    "Вот сука!",
    "Гори в аду мразь!",
    "Пидорас фартовый!",
    "Мразь ебаная убью!",
    "I'm dead"
];

// Фразы для разных стадий гнева
const PHRASES_LOW = [
    "Открывай дверь, хуесос! Щас повестку в жопу засуну!",
    "Эй, пидор в норе! Выходи служить, или дверь выломаем!",
    "Сука, не дёргайся! Военкомат пришёл!",
    "Дверь открывай, уёбок! Или тараном ебнём!",
    "Хули прячешься, сынок? Выходи, подпиши!"
];

const PHRASES_MED = [
    "Щас дверь взорвём, сука! Вытащим за яйца!",
    "Открывай, падла! Или ломом в рыло!",
    "Эй, крыса! Дверь сломаем, хуем по башке дадим!",
    "Не пизди, открывай! Щас гранату кинем!",
    "Дверь долбим, урод! Вытащим и в штрафбат!"
];

const PHRASES_HIGH = [
    "Я знаю, ты там... Открывай тихо...",
    "Слышу твое дыхание, тварь... Дверь откроется сама...",
    "Мама твоя уже в камере... Открывай...",
    "Щас войду без стука... Вижу тебя сквозь дверь...",
    "Ты наш... Навсегда... Беги — не спрячешься..."
];

export const Voenkom: React.FC = () => {
  const { 
    doorOpen, 
    voenkomHp, 
    takeDamage, 
    voenkomState, 
    setVoenkomState,
    setMessage,
    gameStarted,
    isGameOver,
    isVictory,
    setDetentionTime,
    setShowPovestka,
    voenkomFrozen
  } = useGameStore();

  // Физическое тело
  const [ref, api] = useSphere(() => ({ 
    mass: 1000, // Очень тяжелый, чтобы игрок не мог его толкать
    position: [0, 1.5, -9.0], // Начальная позиция далеко за дверью
    args: [0.6], 
    type: 'Dynamic',
    fixedRotation: true, 
    linearDamping: 0.9,
    collisionFilterGroup: GROUP_VOENKOM,
    collisionFilterMask: GROUP_SCENE | GROUP_PLAYER
  }));

  const visualRef = useRef<Group>(null);
  
  // Локальные рефы для логики (чтобы не зависеть от ре-рендеров)
  const pos = useRef([0, 1.5, -9.0]); 
  const vel = useRef([0, 0, 0]);
  const wasDoorOpen = useRef(false);
  const angerLevel = useRef(0); 
  
  // Таймеры
  const knockTimer = useRef(1.0);
  const shoutTimer = useRef(2.0);
  const bellTimer = useRef(Math.random() * 20 + 5); // 5-25 seconds for bell
  const scaryTimer = useRef(10.0);
  const hasRungBell = useRef(false);

  const timePlayerStill = useRef(0);
  const lastPlayerPos = useRef(new Vector3(0,0,0));
  const lastAttackTime = useRef(0);

  // Состояние анимации
  const [isMoving, setIsMoving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [finalDeath, setFinalDeath] = useState(false);
  const speakAnimTimer = useRef(0);

  // Подписка на физику
  useEffect(() => api.position.subscribe(p => {
    pos.current = p;
    (window as any).voenkomPosition = new Vector3(p[0], p[1], p[2]);
  }), [api]);

  useEffect(() => api.velocity.subscribe(v => vel.current = v), [api]);

  // Death sequence logic
  useEffect(() => {
    if (voenkomState === 'dead') {
        setTimeout(() => {
            const phrase = DEATH_PHRASES[Math.floor(Math.random() * DEATH_PHRASES.length)];
            speak(phrase, 1, 0.8, 0.1);
            setTimeout(() => {
                setFinalDeath(true);
            }, audioService.getDuration(phrase) + 500);
        }, 1000); // 1-second delay before death quote
    }
  }, [voenkomState]);

  // Функция речи
  const speak = (text: string, v: number = 1, r: number = 1, p: number = 0.2) => {
    audioService.speak(text, v, r, p);
    speakAnimTimer.current = text.length * 0.1; // Примерное время анимации рта
    if (voenkomState !== 'chasing' && voenkomState !== 'attacking') {
        setMessage(`ВОЕНКОМ: "${text}"`);
    }
  };

  useFrame((state, delta) => {
    if (!gameStarted) return;

    // --- ЛОГИКА СМЕРТИ ---
    if (voenkomState === 'dead') {
        if (pos.current[1] > -5) {
            api.position.set(pos.current[0], -10, pos.current[2]);
            api.velocity.set(0, 0, 0);
        }
        if (visualRef.current) {
            visualRef.current.rotation.x = -Math.PI / 2;
            visualRef.current.position.y = 0.2;
        }
        return;
    }

    if (isGameOver) {
        api.velocity.set(0, 0, 0);
        return;
    }

    // Синхронизация визуальной модели
    if (visualRef.current) {
        visualRef.current.position.set(pos.current[0], pos.current[1] - 0.6, pos.current[2]);
    }

    // Анимация речи
    if (speakAnimTimer.current > 0) {
        speakAnimTimer.current -= delta;
        setIsSpeaking(true);
    } else {
        setIsSpeaking(false);
    }

    // --- ПРОВЕРКА ОТКРЫТИЯ ДВЕРИ ---
    if (doorOpen && !wasDoorOpen.current) {
        wasDoorOpen.current = true;
        
        const startTime = useGameStore.getState().gameStartTime;
        const now = Date.now();
        const elapsed = (startTime > 0) ? now - startTime : 0; 
        
        console.log("Дверь открылась. Прошло мс:", elapsed);

        if (elapsed < 30000) { // 30 секунд
            setVoenkomState('offering');
            setShowPovestka(true);
            speak("Гражданин, распишитесь в повестке.", 1, 1.0, 0.3);
            setMessage("ВАМ ВРУЧАЮТ ПОВЕСТКУ [Y - Взять / N - Отказать]");
        } else {
            setVoenkomState('checking'); // Сразу агрессия
            speak("Ну всё, доигрался, щенок!", 1, 1.2, 0.1);
            angerLevel.current = 50;
        }
    }

    // --- ПОВЕДЕНИЕ ПО СОСТОЯНИЯМ ---

    // 1. ОЖИДАНИЕ ЗА ДВЕРЬЮ
    if (voenkomState === 'waiting') {
        const diffX = 0 - pos.current[0];
        const diffZ = -9.0 - pos.current[2];
        
        if (Math.abs(diffX) > 0.1 || Math.abs(diffZ) > 0.1) {
             api.velocity.set(diffX * 5, -5, diffZ * 5);
        } else {
             api.velocity.set(0, -5, 0); 
        }
        setIsMoving(false);

        angerLevel.current += delta * 2.0;
        const gameTime = state.clock.elapsedTime;
        knockTimer.current -= delta;
        if (knockTimer.current <= 0) {
            audioService.playKnockSound();
            knockTimer.current = 2.0 + Math.random() * 2.0;
        }

        if (!hasRungBell.current && gameTime < 30.0) {
            bellTimer.current -= delta;
            if (bellTimer.current <= 0) {
                audioService.playDoorBell();
                hasRungBell.current = true;
            }
        }

        if (gameTime > 60.0) {
            scaryTimer.current -= delta;
            if (scaryTimer.current <= 0) {
                audioService.playScarySound();
                scaryTimer.current = 10.0;
            }
        }

        shoutTimer.current -= delta;
        if (shoutTimer.current <= 0) {
            let phrases = PHRASES_LOW;
            if (angerLevel.current > 40) phrases = PHRASES_MED;
            if (angerLevel.current > 80) phrases = PHRASES_HIGH;
            
            const text = phrases[Math.floor(Math.random() * phrases.length)];
            speak(text, 1.2, 1.1, 0.2);
            shoutTimer.current = Math.max(3.0, 10.0 - (angerLevel.current / 10)) + Math.random() * 5;
        }
    }

    // 2. ВРУЧЕНИЕ ПОВЕСТКИ
    else if (voenkomState === 'offering') {
        const targetZ = -4.5;
        const dist = targetZ - pos.current[2];

        if (visualRef.current) {
            visualRef.current.lookAt(state.camera.position.x, visualRef.current.position.y, state.camera.position.z);
        }

        if (dist > 0.1) {
            api.velocity.set(0, -5, 2.0); 
            setIsMoving(true);
        } else {
            api.velocity.set(0, -5, 0);
            setIsMoving(false);
            setShowPovestka(true); 
        }
        return;
    }

    // 3. АГРЕССИЯ
    else {
        const playerPos = state.camera.position;
        const myPos = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
        const distToPlayer = myPos.distanceTo(playerPos);
        const dir = new Vector3().subVectors(playerPos, myPos).normalize();

        if (visualRef.current) {
            visualRef.current.lookAt(playerPos.x, visualRef.current.position.y, playerPos.z);
        }

        if (voenkomState === 'checking') {
            const playerMovedDist = lastPlayerPos.current.distanceTo(playerPos);
            lastPlayerPos.current.copy(playerPos);

            if (playerMovedDist < 0.01) {
                timePlayerStill.current += delta;
                setDetentionTime(timePlayerStill.current);
            } else {
                setVoenkomState('chasing');
                speak("А ну стоять, уклонист!", 1, 1.3, 0.1);
                timePlayerStill.current = 0;
                setDetentionTime(0);
            }
            
            if (timePlayerStill.current > 5.0) {
                takeDamage(100); 
                setMessage("ТЫ ПОЙМАН");
            }
        } 
        
        if (distToPlayer < 1.8) {
            api.velocity.set(0, -10, 0); 
            setIsMoving(false);
            if (voenkomState !== 'attacking') {
                setVoenkomState('attacking');
            }
        } else {
            if (voenkomState !== 'checking') {
                const speed = 5.5;
                api.velocity.set(dir.x * speed, -5, dir.z * speed);
                setIsMoving(true);
            } else {
                api.velocity.set(0, -5, 0);
                setIsMoving(false);
            }
        }

        if (voenkomState === 'attacking' && distToPlayer < 2.5) {
            if (state.clock.elapsedTime - lastAttackTime.current > 1.0) {
                lastAttackTime.current = state.clock.elapsedTime;
                takeDamage(20);
                audioService.playHit();
                
                if (Math.random() > 0.5) {
                     const phrase = ["На сука!", "В армию нахуй!", "Получай!", "Сдохни гнида!"];
                     speak(phrase[Math.floor(Math.random() * phrase.length)], 1, 1.5, 0.1);
                }
            }
        }
    }
  });

  return (
    <group>
       <mesh ref={ref as any}>
         <sphereGeometry args={[0.6]} />
         <meshBasicMaterial transparent opacity={0} />
       </mesh>

       <group ref={visualRef} frustumCulled={false} name="VOENKOM_HITBOX">
          {gameStarted && !isVictory && voenkomState !== 'dead' && (
              <Html position={[0, 3.2, 0]} center>
                  <div className="w-32 h-3 bg-gray-900 border-2 border-white rounded">
                      <div 
                        className="h-full bg-red-600 transition-all" 
                        style={{ width: `${voenkomHp}%` }} 
                      />
                  </div>
              </Html>
          )}
          
          <CustomVoenkom 
              isMoving={isMoving} 
              isAttacking={voenkomState === 'attacking'}
              isSpeaking={isSpeaking}
              angerLevel={angerLevel.current}
              isOffering={voenkomState === 'offering'}
              isFrozen={voenkomFrozen}
              isTrulyDead={finalDeath}
          />
       </group>
    </group>
  );
};