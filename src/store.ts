

import { create } from 'zustand';
import { GameState, INITIAL_STATE, WeaponType, WorldItemData, BulletData } from './types';
import { Vector3 } from 'three';

interface GameStore extends GameState {
  startGame: () => void;
  takeDamage: (amount: number) => void;
  damageVoenkom: (amount: number) => void;
  pickupItem: (itemId: string) => void;
  dropCurrentItem: (playerPos: [number, number, number], playerRot: [number, number, number, number]) => void;
  setActiveSlot: (slot: number) => void;
  useAmmo: () => void;
  toggleDoor: () => void;
  togglePeephole: (active: boolean) => void;
  setVoenkomState: (state: GameState['voenkomState']) => void;
  setMessage: (msg: string) => void;
  reset: () => void;
  setInteractionText: (text: string) => void;
  setDetentionTime: (time: number) => void;
  setShowPovestka: (show: boolean) => void;
  acceptPovestka: () => void;
  rejectPovestka: () => void;
  addBullet: (pos: Vector3, dir: Vector3) => void;
  updateBullets: (delta: number, voenkomPos: Vector3 | null) => void;
}

const SHELF_ITEMS: WorldItemData[] = [
    { id: 'glock-1', type: 'glock', position: [-2, 1.3, 3.2], rotation: [0, -1.5, 0], name: 'Глок' },
    { id: 'axe-1', type: 'axe', position: [-2, 1.3, 3.5], rotation: [0, 0, 1.5], name: 'Топор' },
    { id: 'machete-1', type: 'machete', position: [-2, 1.3, 3.8], rotation: [0, 0, 1.5], name: 'Мачете' },
    { id: 'bat-1', type: 'bat', position: [-1.8, 0.5, 3.5], rotation: [0, 0, 0.2], name: 'Бита' }
];

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  worldItems: SHELF_ITEMS,
  message: "WASD - Ходить. F - Взаимодействие. G - Инвентарь.",
  interactionText: "",
  
  startGame: () => set({ gameStarted: true, gameStartTime: Date.now(), message: "Подбери оружие (G) и выживи." }),
  
  takeDamage: (amount) => {
    set(state => {
        if (state.isGameOver) return {};
        const newHp = Math.max(0, state.playerHp - amount);
        if (newHp === 0) {
            return { playerHp: 0, isGameOver: true, message: "ТЫ ПОГИБ. Военком забрал тебя." };
        }
        return { playerHp: newHp };
    });
  },

  damageVoenkom: (amount) => {
    const currentState = get();
    if (currentState.isGameOver || currentState.isVictory || currentState.voenkomState === 'dead') return;

    if (currentState.voenkomState === 'offering') {
        get().rejectPovestka();
    }
    
    const newHp = Math.max(0, currentState.voenkomHp - amount);

    if (newHp === 0) {
        set({ voenkomHp: 0, isVictory: true, voenkomState: 'dead', message: "Военком мертв. Ты свободен!" });
    } else {
        set({ voenkomHp: newHp });
    }
  },

  pickupItem: (itemId) => {
    const { worldItems, inventory, activeSlot } = get();
    const item = worldItems.find(i => i.id === itemId);
    if (!item) return;

    const newInventory = [...inventory];
    let targetSlot = activeSlot;
    if (newInventory[activeSlot] !== null) {
        const emptyIndex = newInventory.findIndex(s => s === null);
        if (emptyIndex !== -1) targetSlot = emptyIndex;
        else {
             const oldItem = newInventory[activeSlot];
             if (oldItem) {
                 const droppedItem: WorldItemData = { id: `${oldItem}-${Date.now()}`, type: oldItem, position: item.position, rotation: [0,0,0], name: oldItem === 'glock' ? 'Глок' : oldItem === 'axe' ? 'Топор' : oldItem === 'machete' ? 'Мачете' : 'Бита' };
                 set(state => ({ worldItems: [...state.worldItems, droppedItem] }));
             }
             targetSlot = activeSlot;
        }
    }
    newInventory[targetSlot] = item.type;
    set({ inventory: newInventory, activeSlot: targetSlot, message: `Подобрано: ${item.name}`, worldItems: worldItems.filter(i => i.id !== itemId) });
  },

  dropCurrentItem: (pos, rotQuat) => {
    const { inventory, activeSlot } = get();
    const currentWeapon = inventory[activeSlot];
    if (!currentWeapon) return;
    const forward = new Vector3(0, 0, -1).applyQuaternion({ x: rotQuat[0], y: rotQuat[1], z: rotQuat[2], w: rotQuat[3] } as any);
    const dropPos: [number, number, number] = [pos[0] + forward.x * 1.5, pos[1] + 1.2, pos[2] + forward.z * 1.5];
    const newItem: WorldItemData = { id: `${currentWeapon}-${Date.now()}`, type: currentWeapon, position: dropPos, rotation: [Math.random() * 6, Math.random() * 6, Math.random() * 6], name: currentWeapon === 'glock' ? 'Глок' : currentWeapon === 'axe' ? 'Топор' : currentWeapon === 'machete' ? 'Мачете' : 'Бита' };
    const newInventory = [...inventory];
    newInventory[activeSlot] = null;
    set((state) => ({ inventory: newInventory, worldItems: [...state.worldItems, newItem], message: "Предмет выброшен" }));
  },
  
  setActiveSlot: (slot) => set({ activeSlot: slot }),
  useAmmo: () => set((state) => ({ ammo: Math.max(0, state.ammo - 1) })),
  toggleDoor: () => set((state) => ({ doorOpen: !state.doorOpen, message: state.doorOpen ? "Дверь закрыта" : "Дверь открыта" })),
  togglePeephole: (active) => set({ lookingThroughPeephole: active }),
  setVoenkomState: (state) => set({ voenkomState: state }),
  setMessage: (msg) => set({ message: msg }),
  setInteractionText: (text) => set({ interactionText: text }),
  setDetentionTime: (time) => set({ detentionTime: time }),
  setShowPovestka: (show) => set({ showPovestka: show }),
  
  acceptPovestka: () => set({ showPovestka: false, isGameOver: true, message: "Ебать ты лох Вася...", playerHp: 0, voenkomFrozen: true }),
  rejectPovestka: () => set({ showPovestka: false, voenkomState: 'attacking', message: "ТЫ ОТКАЗАЛСЯ! ОН В ЯРОСТИ!" }),
  
  addBullet: (pos, dir) => {
      const speed = 25; 
      const velocity: [number, number, number] = [dir.x * speed, dir.y * speed, dir.z * speed];
      const newBullet: BulletData = { id: `b-${Date.now()}-${Math.random()}`, position: [pos.x, pos.y, pos.z], velocity: velocity, createdAt: Date.now() };
      set(state => ({ bullets: [...state.bullets, newBullet] }));
  },

  updateBullets: (delta, voenkomPos) => {
      set(state => {
          if (state.bullets.length === 0) return {};
          const nextBullets: BulletData[] = [];
          const now = Date.now();
          let totalHits = 0;

          state.bullets.forEach(b => {
              if (now - b.createdAt > 2000) return;
              const nextPos: [number, number, number] = [ b.position[0] + b.velocity[0] * delta, b.position[1] + b.velocity[1] * delta, b.position[2] + b.velocity[2] * delta ];
              let hit = false;
              if (voenkomPos && state.voenkomState !== 'dead') {
                  const dx = nextPos[0] - voenkomPos.x;
                  const dz = nextPos[2] - voenkomPos.z;
                  const distHorizontal = Math.sqrt(dx*dx + dz*dz);
                  const distVertical = nextPos[1];
                  if (distHorizontal < 0.6 && distVertical > 0 && distVertical < 2.8) {
                      hit = true;
                      totalHits++;
                  }
              }
              if (!hit && (nextPos[0] < -5 || nextPos[0] > 5 || nextPos[1] < 0 || nextPos[1] > 10 || (nextPos[2] < -4.2 && Math.abs(nextPos[0]) > 1))) {
                  hit = true;
              }
              if (!hit) {
                  nextBullets.push({ ...b, position: nextPos });
              }
          });
          
          if (totalHits > 0) {
              get().damageVoenkom(25 * totalHits);
              if (get().voenkomState !== 'attacking' && get().voenkomState !== 'dead') {
                  get().setVoenkomState('attacking');
              }
          }
          
          return { bullets: nextBullets };
      });
  },

  reset: () => set({ ...INITIAL_STATE, worldItems: SHELF_ITEMS, message: "WASD - Ходить. F - Взаимодействие. G - Инвентарь.", interactionText: "" }),
}));