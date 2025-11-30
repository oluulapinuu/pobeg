
export type WeaponType = 'fist' | 'glock' | 'axe' | 'bat' | 'machete';

export interface WorldItemData {
  id: string;
  type: WeaponType;
  position: [number, number, number];
  rotation: [number, number, number];
  name: string;
}

export interface BulletData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  createdAt: number;
}

export interface GameState {
  isGameOver: boolean;
  isVictory: boolean;
  gameStarted: boolean;
  gameStartTime: number;
  doorOpen: boolean;
  playerHp: number;
  voenkomHp: number;
  
  // Inventory System
  inventory: (WeaponType | null)[]; // 9 slots
  activeSlot: number;
  ammo: number; 
  
  message: string;
  lookingThroughPeephole: boolean;
  voenkomState: 'waiting' | 'offering' | 'checking' | 'chasing' | 'attacking' | 'dead';
  detentionTime: number;
  showPovestka: boolean; // UI flag for overlay
  voenkomFrozen: boolean; // Flag to freeze voenkom animations on certain game overs

  worldItems: WorldItemData[];
  bullets: BulletData[];
  
  interactionText: string;
}

export const INITIAL_STATE: GameState = {
  isGameOver: false,
  isVictory: false,
  gameStarted: false,
  gameStartTime: 0,
  doorOpen: false,
  playerHp: 100,
  voenkomHp: 150,
  
  inventory: [null, null, null, null, null, null, null, null, null],
  activeSlot: 0,
  ammo: 6,
  
  message: "WASD to Move. F to Interact. G to Pickup/Drop.",
  lookingThroughPeephole: false,
  voenkomState: 'waiting',
  detentionTime: 0,
  showPovestka: false,
  voenkomFrozen: false,

  worldItems: [], // Will be populated in store.ts to avoid duplication or resetting issues
  bullets: [],
  interactionText: ""
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js elements
      mesh: any;
      group: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      cylinderGeometry: any;
      planeGeometry: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      primitive: any;
      videoTexture: any;
      torusGeometry: any;

      // HTML Elements
      div: any;
      span: any;
      p: any;
      h1: any;
      h2: any;
      button: any;
      br: any;
    }
  }
}
