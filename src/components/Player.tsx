
import React, { useEffect, useRef, useState } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, PerspectiveCamera, Raycaster, Vector2, Object3D } from 'three';
import { useGameStore } from '../store';
import { audioService } from '../services/audioService';
import { PlayerHands } from './Models';

const SPEED = 5.5;
const SPRINT_SPEED = 10.5;

// Physics Groups
const GROUP_SCENE = 1;
const GROUP_PLAYER = 2;
const GROUP_ITEMS = 4;
const GROUP_VOENKOM = 8;

export const Player: React.FC = () => {
  const { camera, scene } = useThree();
  const [ref, api] = useSphere(() => ({ 
    mass: 1, 
    type: 'Dynamic', 
    position: [0, 2, 5], 
    args: [0.5], 
    fixedRotation: true, 
    linearDamping: 0.95,
    collisionFilterGroup: GROUP_PLAYER,
    collisionFilterMask: GROUP_SCENE | GROUP_VOENKOM
  }));

  const { 
    inventory,
    activeSlot,
    setActiveSlot,
    ammo, 
    useAmmo, 
    damageVoenkom, 
    dropCurrentItem,
    pickupItem,
    addBullet,
    updateBullets,
    lookingThroughPeephole,
    togglePeephole,
    toggleDoor,
    doorOpen,
    gameStarted,
    isGameOver,
    setVoenkomState,
    setInteractionText,
    worldItems
  } = useGameStore();

  const weapon = inventory[activeSlot] || 'fist';

  const [lastShot, setLastShot] = useState(0);
  const [attackAnim, setAttackAnim] = useState(0); 
  const velocity = useRef([0, 0, 0]);
  const playerPos = useRef([0, 0, 0]);
  const handsRef = useRef<Group>(null);
  const [isMoving, setIsMoving] = useState(false);
  const mouseMoveRef = useRef(0);
  const lastPeepholeSpeech = useRef(0);
  
  const raycaster = useRef(new Raycaster());
  const interactionTarget = useRef<string | null>(null);
  
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);
  useEffect(() => api.position.subscribe((p) => (playerPos.current = p)), [api.position]);

  const getLookingAtItem = () => {
      const pPos = new Vector3(playerPos.current[0], playerPos.current[1] + 1.15, playerPos.current[2]);
      const camDir = new Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
      
      let closestItem = null;
      let closestDist = Infinity;

      for (const item of worldItems) {
          const itemPos = new Vector3(...item.position);
          const dist = pPos.distanceTo(itemPos);
          if (dist > 3.0) continue; 

          const toItem = itemPos.clone().sub(pPos).normalize();
          const dot = camDir.dot(toItem);
          
          if (dot > 0.99) {
              if (dist < closestDist) {
                  closestDist = dist;
                  closestItem = item;
              }
          }
      }
      return closestItem;
  };

  useEffect(() => {
    const handleKeyDown = (e: any) => { 
        keys.current[e.code] = true; 
        
        if (e.key >= '1' && e.key <= '9') {
            setActiveSlot(parseInt(e.key) - 1);
        }

        if (e.code === 'KeyG') {
            const item = getLookingAtItem();
            
            if (item) {
                pickupItem(item.id);
            } else if (weapon !== 'fist') {
                dropCurrentItem(playerPos.current as [number,number,number], camera.quaternion.toArray() as any);
            }
        }

        if (e.code === 'KeyF') {
            if (lookingThroughPeephole) {
                togglePeephole(false);
                return;
            }

            if (interactionTarget.current === 'PEEPHOLE') {
                togglePeephole(true);
                setInteractionText("");
            } else if (interactionTarget.current === 'DOOR_HANDLE') {
                toggleDoor();
                setInteractionText("");
            }
        }
    };
    const handleKeyUp = (e: any) => { keys.current[e.code] = false; };
    
    const handleMouseDown = (e: any) => {
      if (!gameStarted || isGameOver) return; 
      if (e.button === 0) handleAttack();
    };

    const handleMouseMove = (e: any) => {
        if (lookingThroughPeephole) {
            mouseMoveRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
        }
    };

    (window as any).addEventListener('keydown', handleKeyDown);
    (window as any).addEventListener('keyup', handleKeyUp);
    (window as any).addEventListener('mousedown', handleMouseDown);
    (window as any).addEventListener('mousemove', handleMouseMove);
    return () => {
      (window as any).removeEventListener('keydown', handleKeyDown);
      (window as any).removeEventListener('keyup', handleKeyUp);
      (window as any).removeEventListener('mousedown', handleMouseDown);
      (window as any).removeEventListener('mousemove', handleMouseMove);
    };
  }, [weapon, ammo, gameStarted, isGameOver, lookingThroughPeephole, worldItems, doorOpen]);

  const isVoenkom = (obj: Object3D | null): boolean => {
      if (!obj) return false;
      if (obj.name === 'VOENKOM_HITBOX') return true;
      return isVoenkom(obj.parent);
  };

  const handleAttack = () => {
    if (lookingThroughPeephole) return;

    const now = Date.now();
    
    let cooldown = 1250; // default for axe, bat, machete
    if (weapon === 'glock') cooldown = 400;
    if (weapon === 'fist') cooldown = 1850; // Fist cooldown is 1.85s

    if (now - lastShot < cooldown) return;

    setAttackAnim(Date.now());
    
    if (weapon === 'glock') {
      if (ammo > 0) {
        useAmmo();
        audioService.playGunshot();
        setLastShot(now);
        
        const currentState = useGameStore.getState().voenkomState;
        if (currentState !== 'dead' && currentState !== 'attacking') {
            setVoenkomState('attacking');
        }

        const bulletStartPos = new Vector3(0, -0.2, 0).applyQuaternion(camera.quaternion).add(camera.position);
        const direction = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
        addBullet(bulletStartPos, direction);

      } else {
          audioService.playKnock(0.05); 
      }
      return;
    } 

    audioService.playWoosh();
    setLastShot(now);

    let range = 2;
    let dmg = 10;
    if (weapon === 'axe') { dmg = 25; range = 2.5; }
    if (weapon === 'bat') { dmg = 25; range = 3; }
    if (weapon === 'machete') { dmg = 50; range = 2.5; }

    raycaster.current.setFromCamera(new Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    const hit = intersects.find(i => i.distance < range);

    if (hit) {
        if (isVoenkom(hit.object)) {
             damageVoenkom(dmg);
             audioService.playHit();
             const currentState = useGameStore.getState().voenkomState;
             if (currentState !== 'dead' && currentState !== 'attacking') {
                 setVoenkomState('attacking');
             }
        } else {
            audioService.playWallHit();
        }
    }
  };

  useFrame((state, delta) => {
    const perspCamera = camera as PerspectiveCamera;
    const voenkomPos = (window as any).voenkomPosition as Vector3;

    if (gameStarted && !isGameOver && !lookingThroughPeephole) {
        let hint = "";
        interactionTarget.current = null;
        
        const item = getLookingAtItem();
        if (item) {
             hint = `G: Взять ${item.name}`;
        } else {
            raycaster.current.setFromCamera(new Vector2(0, 0), camera);
            const intersects = raycaster.current.intersectObjects(scene.children, true);
            const hit = intersects.find(i => i.distance < 2.5 && (i.object.name === 'DOOR_HANDLE' || i.object.name === 'PEEPHOLE'));
            
            if (hit) {
                if (hit.object.name === 'PEEPHOLE' && !doorOpen) {
                    interactionTarget.current = 'PEEPHOLE';
                    hint = "F: Глазок";
                } else if (hit.object.name === 'DOOR_HANDLE') {
                    interactionTarget.current = 'DOOR_HANDLE';
                    hint = doorOpen ? "F: Закрыть" : "F: Открыть";
                }
            }
        }
        setInteractionText(hint);
    }

    updateBullets(delta, voenkomPos);
    
    if (lookingThroughPeephole && !isGameOver) {
        if (perspCamera.fov !== 130) {
            perspCamera.fov = 130;
            perspCamera.updateProjectionMatrix();
        }
        camera.position.set(0, 1.55, -3.95);
        camera.lookAt(0, 1.55, -10); 

        if (mouseMoveRef.current > 500) {
            const now = state.clock.elapsedTime;
            if (now - lastPeepholeSpeech.current > 3) {
                const phrases = ["Я вижу как ты там шевелишься!","Че в глазок уставился, чушпан?","Открывай, я знаю что ты за дверью!","Глаз выколю нахер!","Харе дышать в глазок!"];
                audioService.speak(phrases[Math.floor(Math.random() * phrases.length)], 1, 1.1, 0.2); 
                lastPeepholeSpeech.current = now;
                mouseMoveRef.current = 0;
            }
        }
        mouseMoveRef.current *= 0.9;
    } else {
        if (perspCamera.fov !== 75) {
            perspCamera.fov = 75;
            perspCamera.updateProjectionMatrix();
        }
    }

    if (!ref.current) return;
    if (isGameOver) {
      api.velocity.set(0,0,0);
      return;
    }
    
    const { KeyW, KeyS, KeyA, KeyD, ShiftLeft, KeyC } = keys.current;
    
    if (lookingThroughPeephole) {
         api.velocity.set(0, 0, 0);
         return;
    }

    const speed = ShiftLeft ? SPRINT_SPEED : SPEED;
    const finalSpeed = KeyC ? speed * 0.5 : speed;

    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    const moveDir = new Vector3();
    if (KeyW) moveDir.add(forward);
    if (KeyS) moveDir.sub(forward);
    if (KeyD) moveDir.add(right);
    if (KeyA) moveDir.sub(right);
    
    if (moveDir.length() > 0) {
        moveDir.normalize().multiplyScalar(finalSpeed);
        setIsMoving(true);
    } else {
        setIsMoving(false);
    }

    api.velocity.set(moveDir.x, velocity.current[1], moveDir.z);

    const camHeight = KeyC ? 0.7 : 1.15;
    if (!lookingThroughPeephole) {
        camera.position.lerp(new Vector3(playerPos.current[0], playerPos.current[1] + camHeight, playerPos.current[2]), 0.4);
    }

    if (handsRef.current) {
        handsRef.current.position.copy(camera.position);
        handsRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <>
      <mesh ref={ref as any}>
        <sphereGeometry args={[0.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <group ref={handsRef}>
          <group>
             {!lookingThroughPeephole && (
                <PlayerHands 
                    weapon={weapon} 
                    isMoving={isMoving} 
                    attackTrigger={attackAnim} 
                />
             )}
          </group>
      </group>
    </>
  );
};
