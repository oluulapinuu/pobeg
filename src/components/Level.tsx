
import React, { useRef, useState, useEffect } from 'react';
import { useBox, usePlane } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { Group, SpotLight } from 'three';
import { Environment } from '@react-three/drei';
import { useGameStore } from '../store';
import { WorldItemData } from '../types';
import { VoxelGlock, VoxelAxe, VoxelBat, VoxelMachete } from './Models';
import { Kid } from './Kid';

const GROUP_SCENE = 1;
const GROUP_PLAYER = 2;
const GROUP_ITEMS = 4;
const GROUP_VOENKOM = 8;

const Wall: React.FC<{ position: [number, number, number], args: [number, number, number], color?: string }> = ({ position, args, color = "#e0e0e0" }) => {
  const [ref] = useBox(() => ({ 
    type: 'Static', 
    position, 
    args,
    collisionFilterGroup: GROUP_SCENE,
    collisionFilterMask: -1
  }));
  
  return (
    <mesh ref={ref as any} castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
};

const TrashChute: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const [ref] = useBox(() => ({ 
        type: 'Static', 
        position, 
        args: [0.8, 3, 0.8],
        collisionFilterGroup: GROUP_SCENE,
        collisionFilterMask: -1
    }));
    return (
        <group ref={ref as any}>
            <mesh position={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 3, 16]} />
                <meshStandardMaterial color="#9e9e9e" roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.2, 0.35]} rotation={[0.5, 0, 0]}>
                <boxGeometry args={[0.3, 0.4, 0.1]} />
                <meshStandardMaterial color="#616161" />
            </mesh>
            <mesh position={[0, -0.2, 0.38]}>
                <boxGeometry args={[0.05, 0.1, 0.05]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    )
}

const Shelf: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const [ref] = useBox(() => ({ 
        type: 'Static', 
        position, 
        args: [1.0, 0.1, 1.0],
        collisionFilterGroup: GROUP_SCENE,
        collisionFilterMask: -1
    }));
    return (
        <mesh ref={ref as any} castShadow>
            <boxGeometry args={[1.0, 0.1, 1.0]} />
            <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
    );
}

const ApartmentDoor: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0,0,0] }) => {
    return (
        <group position={position} rotation={rotation as any}>
            <mesh receiveShadow>
                <boxGeometry args={[1.2, 2.2, 0.1]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
            <mesh position={[0.5, 0, 0.06]}>
                <sphereGeometry args={[0.05]} />
                <meshStandardMaterial color="silver" metalness={0.8} />
            </mesh>
            <mesh position={[0, 1.2, 0.02]}>
                <boxGeometry args={[0.3, 0.15, 0.05]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    )
}

const Floor: React.FC = () => {
  const [ref] = usePlane(() => ({ 
      rotation: [-Math.PI / 2, 0, 0], 
      position: [0, 0, 0],
      collisionFilterGroup: GROUP_SCENE,
      collisionFilterMask: -1 
  }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#b0bec5" roughness={0.6} />
    </mesh>
  );
};

const Ceiling: React.FC = () => {
    return (
        <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#fafafa" />
        </mesh>
    )
}

const PhysicsItem: React.FC<{ item: WorldItemData }> = ({ item }) => {
    const { id, type, position, rotation } = item;
    const [ref] = useBox(() => ({
        mass: 10, 
        position: position,
        rotation: rotation as [number, number, number],
        args: [0.5, 0.5, 0.5],
        linearDamping: 0.95, 
        angularDamping: 0.95,
        collisionFilterGroup: GROUP_ITEMS,
        collisionFilterMask: GROUP_SCENE 
    }));
    
    return (
        <group ref={ref as any}>
            <group scale={[0.8, 0.8, 0.8]}>
                {type === 'glock' && <VoxelGlock />}
                {type === 'axe' && <VoxelAxe />}
                {type === 'bat' && <VoxelBat />}
                {type === 'machete' && <VoxelMachete />}
            </group>
        </group>
    );
};

const BulletRenderer: React.FC = () => {
    const { bullets } = useGameStore();
    return (
        <>
            {bullets.map(b => (
                <mesh key={b.id} position={b.position}>
                    <boxGeometry args={[0.05, 0.05, 0.2]} />
                    <meshBasicMaterial color="yellow" />
                </mesh>
            ))}
        </>
    )
}

const VideoWindow: React.FC = () => {
    const { gameStarted } = useGameStore();
    const videoRef = useRef<any>(null);
    const [video] = useState(() => {
        const vid = (window as any).document.createElement("video");
        vid.src = "https://cdn.jsdelivr.net/gh/oluulapinuu/vv@main/window.mp4";
        vid.crossOrigin = "Anonymous";
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        videoRef.current = vid;
        return vid;
    });

    useEffect(() => {
        const playVideo = () => {
            if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((e: any) => {});
            }
        };

        if (gameStarted) {
            playVideo();
        }
        
        const doc = (window as any).document;
        doc.addEventListener('click', playVideo);
        (window as any).addEventListener('focus', playVideo);

        return () => {
            doc.removeEventListener('click', playVideo);
            (window as any).removeEventListener('focus', playVideo);
        };
    }, [gameStarted, video]);

    return (
        <mesh position={[0, 2, 9.45]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[2.5, 2.5]} />
            <meshStandardMaterial emissive="white" emissiveIntensity={0.2} toneMapped={false}>
                <videoTexture attach="map" args={[video]} />
                <videoTexture attach="emissiveMap" args={[video]} />
            </meshStandardMaterial>
        </mesh>
    );
};

export const Level: React.FC = () => {
    const { doorOpen, worldItems } = useGameStore();
    const flickerLightRef = useRef<any>(null);
    const flickerState = useRef({ timer: Math.random() * 30 + 20, isFlickering: false, sequence: 0 });

    const doorHeight = 2.64;
    const doorWidth = 1.44;
    
    const [doorRef, doorApi] = useBox(() => ({ 
      type: 'Kinematic', 
      position: [0, doorHeight/2, -4], 
      args: [doorWidth, doorHeight, 0.2],
      collisionFilterGroup: GROUP_SCENE,
      collisionFilterMask: -1
    }));
  
    const currentDoorPos = useRef(new Group());
  
    useFrame((state, delta) => {
      const targetRot = doorOpen ? Math.PI / 1.5 : 0;
      const targetX = doorOpen ? doorWidth/1.5 : 0;
      const targetZ = doorOpen ? -4 + doorWidth/3 : -4;
      
      currentDoorPos.current.rotation.y += (targetRot - currentDoorPos.current.rotation.y) * delta * 3;
      currentDoorPos.current.position.x += (targetX - currentDoorPos.current.position.x) * delta * 3;
      currentDoorPos.current.position.z += (targetZ - currentDoorPos.current.position.z) * delta * 3;
  
      doorApi.rotation.set(0, currentDoorPos.current.rotation.y, 0);
      doorApi.position.set(currentDoorPos.current.position.x, doorHeight/2, currentDoorPos.current.position.z);

      if (flickerLightRef.current) {
          const fs = flickerState.current;
          if (fs.isFlickering) {
              fs.sequence += delta * 20;
              flickerLightRef.current.intensity = 0.25 + Math.sin(fs.sequence) * 0.2;
              if (fs.sequence > Math.PI * 4) {
                  fs.isFlickering = false;
                  fs.timer = Math.random() * 30 + 20;
                  flickerLightRef.current.intensity = 0.31;
              }
          } else {
              fs.timer -= delta;
              if (fs.timer <= 0) {
                  fs.isFlickering = true;
                  fs.sequence = 0;
              }
          }
      }
    });

    const peepholeY = 1.55 - (doorHeight/2);

    return (
        <group>
        <Environment preset="apartment" />
        <ambientLight intensity={0.015} color="#607d8b" />
        
        <pointLight ref={flickerLightRef} position={[0, 3.8, -8]} intensity={0.155} distance={15} color="#ffe0b2" castShadow />
        
        <spotLight 
            position={[0, 2, 9]} 
            target-position={[0, 2, 0]} 
            angle={0.5}
            penumbra={0.5}
            intensity={0.0625} 
            color="#aaccff" 
            castShadow 
        />
        
        <Floor />
        <Ceiling />

        <Wall position={[-2.5, 2, 0]} args={[1, 4, 20]} />
        <Wall position={[2.5, 2, 0]} args={[1, 4, 20]} />
        
        <Wall position={[0, 2, 10]} args={[6, 4, 1]} />
        <VideoWindow />

        <Wall position={[-2, 2, -4]} args={[2.5, 4, 0.4]} /> 
        <Wall position={[2, 2, -4]} args={[2.5, 4, 0.4]} />
        <Wall position={[0, 3.32 + (4-3.32)/2, -4]} args={[1.5, 4 - 2.64, 0.4]} />

        <TrashChute position={[-1.8, 1.5, 2]} />
        <Shelf position={[-2, 1.2, 3.5]} />
        
        <ApartmentDoor position={[-1.9, 1.1, 5]} rotation={[0, Math.PI/2, 0]} />
        <ApartmentDoor position={[1.9, 1.1, 5]} rotation={[0, -Math.PI/2, 0]} />
        <ApartmentDoor position={[-1.9, 1.1, -1]} rotation={[0, Math.PI/2, 0]} />
        <ApartmentDoor position={[1.9, 1.1, -1]} rotation={[0, -Math.PI/2, 0]} />

        <group ref={doorRef as any}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[doorWidth, doorHeight, 0.1]} />
                <meshStandardMaterial color="#3e2723" roughness={0.7} />
            </mesh>
            
            <group position={[0, peepholeY, 0.06]}> 
                <mesh>
                    <sphereGeometry args={[0.08]} />
                    <meshStandardMaterial color="black" roughness={0.2} metalness={0.8} />
                </mesh>
                <mesh position={[0, 0, -0.005]} rotation={[Math.PI/2, 0, 0]}>
                    <torusGeometry args={[0.08, 0.02, 16, 32]} />
                    <meshStandardMaterial color="gold" />
                </mesh>
                <mesh name="PEEPHOLE" visible={false}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="red" wireframe />
                </mesh>
            </group>

            <group position={[doorWidth/2 - 0.15, -0.2, 0.1]}>
                <mesh>
                    <boxGeometry args={[0.1, 0.05, 0.15]} />
                    <meshStandardMaterial color="gold" />
                </mesh>
                <mesh name="DOOR_HANDLE" visible={false}>
                    <sphereGeometry args={[0.3]} />
                    <meshBasicMaterial color="red" wireframe />
                </mesh>
            </group>
        </group>

        <Wall position={[0, 2, -12]} args={[6, 4, 1]} color="#cfd8dc" /> 
        <Wall position={[-3, 2, -8]} args={[1, 4, 8]} color="#cfd8dc" />
        <Wall position={[3, 2, -8]} args={[1, 4, 8]} color="#cfd8dc" />

        {worldItems.map(item => (
            <PhysicsItem key={item.id} item={item} />
        ))}

        <Kid />
        
        <BulletRenderer />
      </group>
    );
};
