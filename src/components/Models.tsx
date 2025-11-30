
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Box3, Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { WeaponType } from '../types';

// Materials
const MAT_SKIN = "#f5cba7";
const MAT_PAPER = "#ffffff";
const MAT_METAL = "#546e7a";
const MAT_WOOD = "#5d4037";

// --- HELPER COMPONENTS ---
const Box: React.FC<{ args: [number, number, number], color: string, pos?: [number, number, number], rot?: [number, number, number] }> = ({ args, color, pos = [0,0,0], rot = [0,0,0] }) => (
    <mesh position={pos} rotation={rot as any} castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
);

const Cylinder: React.FC<{ args: [number, number, number, number], color: string, pos?: [number, number, number], rot?: [number, number, number] }> = ({ args, color, pos = [0,0,0], rot = [0,0,0] }) => (
    <mesh position={pos} rotation={rot as any} castShadow receiveShadow>
        <cylinderGeometry args={args} />
        <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
);

// --- VOXEL WEAPONS ---

export const VoxelGlock: React.FC = () => (
    <group rotation={[0, Math.PI / 2, 0]}>
        <Box args={[0.05, 0.1, 0.15]} color="#111" pos={[0, -0.05, 0]} rot={[0.2, 0, 0]} /> {/* Handle */}
        <Box args={[0.06, 0.06, 0.25]} color="#333" pos={[0, 0.05, 0.05]} /> {/* Barrel */}
        <Box args={[0.02, 0.02, 0.05]} color="#111" pos={[0, 0.02, 0.05]} /> {/* Trigger Guard */}
    </group>
);

export const VoxelBat: React.FC = () => (
    <group rotation={[0, 0, -Math.PI / 4]}>
        <Cylinder args={[0.02, 0.025, 0.2, 8]} color={MAT_WOOD} pos={[0, -0.2, 0]} /> {/* Handle */}
        <Cylinder args={[0.025, 0.06, 0.6, 8]} color={MAT_WOOD} pos={[0, 0.2, 0]} /> {/* Body */}
    </group>
);

export const VoxelAxe: React.FC = () => (
    <group rotation={[0, Math.PI/2, 0]}>
        <Box args={[0.04, 0.6, 0.04]} color={MAT_WOOD} pos={[0, 0, 0]} /> {/* Handle */}
        <Box args={[0.05, 0.15, 0.2]} color={MAT_METAL} pos={[0, 0.25, 0.05]} /> {/* Head */}
        <Box args={[0.02, 0.12, 0.1]} color="silver" pos={[0, 0.25, 0.15]} /> {/* Blade Edge */}
    </group>
);

export const VoxelMachete: React.FC = () => (
    <group rotation={[0, Math.PI/2, 0]}>
        <Box args={[0.04, 0.15, 0.04]} color="#3e2723" pos={[0, -0.2, 0]} /> {/* Handle */}
        <Box args={[0.02, 0.5, 0.08]} color="#b0bec5" pos={[0, 0.15, 0]} /> {/* Blade */}
        <Box args={[0.02, 0.1, 0.08]} color="#b0bec5" pos={[0, 0.35, 0.02]} rot={[0.2, 0, 0]} /> {/* Curved Tip */}
    </group>
);

export const PovestkaPaper: React.FC = () => (
    <group>
        <Box args={[0.21, 0.005, 0.29]} color={MAT_PAPER} />
        <Box args={[0.15, 0.006, 0.02]} color="black" pos={[0, 0, -0.1]} /> {/* Text lines */}
        <Box args={[0.18, 0.006, 0.01]} color="black" pos={[0, 0, -0.05]} />
        <Box args={[0.18, 0.006, 0.01]} color="black" pos={[0, 0, 0]} />
        <Box args={[0.10, 0.006, 0.05]} color="red" pos={[0.05, 0, 0.1]} /> {/* Stamp */}
    </group>
);


// --- CUSTOM VOENKOM MODEL ---

export const CustomVoenkom: React.FC<{ 
    isMoving: boolean; 
    isAttacking: boolean; 
    isSpeaking: boolean; 
    angerLevel: number;
    isOffering: boolean;
    isFrozen: boolean;
    isTrulyDead: boolean;
}> = ({ isMoving, isAttacking, isSpeaking, angerLevel, isOffering, isFrozen, isTrulyDead }) => {
    
    const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/oluulapinuu/vv@main/voenkom.glb');
    const modelRef = useRef<Group>(null);

    useEffect(() => {
        if (scene) {
            const box = new Box3().setFromObject(scene);
            const size = new Vector3();
            box.getSize(size);
            
            const targetHeight = 2.55; 
            const scaleFactor = targetHeight / size.y;
            
            scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            const center = new Vector3();
            box.getCenter(center);
            
            scene.position.y = -box.min.y * scaleFactor;
            scene.position.x = -center.x * scaleFactor;
            scene.position.z = -center.z * scaleFactor;

            scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.envMapIntensity = 1; 
                        child.material.needsUpdate = true;
                    }
                }
            });
        }
    }, [scene]);

    useFrame((state, delta) => {
        if (!modelRef.current || isFrozen || isTrulyDead) return;

        const time = state.clock.elapsedTime;
        
        const breathe = Math.sin(time * 2) * 0.02;
        modelRef.current.scale.set(1 + breathe * 0.05, 1 + breathe, 1 + breathe * 0.05);

        if (isMoving) {
            const speed = 15;
            modelRef.current.position.y = Math.abs(Math.sin(time * speed)) * 0.1;
            modelRef.current.rotation.z = Math.sin(time * speed) * 0.05;
        } else {
            modelRef.current.position.y = MathUtils.lerp(modelRef.current.position.y, 0, 0.1);
            modelRef.current.rotation.z = MathUtils.lerp(modelRef.current.rotation.z, 0, 0.1);
        }

        if (isAttacking) {
             const attackCycle = Math.sin(time * 20); 
             modelRef.current.rotation.x = attackCycle * 0.2;
             modelRef.current.position.z = attackCycle * 0.2;
        } else if (!isOffering) {
             modelRef.current.rotation.x = MathUtils.lerp(modelRef.current.rotation.x, 0, 0.1);
             modelRef.current.position.z = MathUtils.lerp(modelRef.current.position.z, 0, 0.1);
        }
        
        if (isOffering) {
            modelRef.current.rotation.x = MathUtils.lerp(modelRef.current.rotation.x, 0.1, 0.05);
        }

        if (isSpeaking) {
             modelRef.current.scale.y = 1 + Math.sin(time * 30) * 0.02;
        }
    });

    return (
        <group ref={modelRef}>
            <primitive object={scene} />
            
            {isOffering && (
                <group position={[0.5, 1.5, 0.8]} rotation={[0.5, 0, -0.2]}>
                    <PovestkaPaper />
                </group>
            )}
        </group>
    );
};


// --- FIRST PERSON HANDS (MINECRAFT STYLE) ---

export const PlayerHands: React.FC<{ weapon: WeaponType | null, isMoving: boolean, attackTrigger: number }> = ({ weapon, isMoving, attackTrigger }) => {
  const group = useRef<Group>(null);
  const animState = useRef(0);

  useEffect(() => {
      animState.current = 1.0;
  }, [attackTrigger]);

  useFrame((state, delta) => {
    if (group.current) {
        const time = state.clock.elapsedTime;
        
        let targetX = 0;
        let targetY = 0;
        
        if (isMoving) {
            targetX = Math.sin(time * 12) * 0.05;
            targetY = Math.abs(Math.sin(time * 12)) * 0.05;
        }
        
        group.current.position.x = MathUtils.lerp(group.current.position.x, 0.5 + targetX, 0.2);
        group.current.position.y = MathUtils.lerp(group.current.position.y, -0.5 + targetY, 0.2);
        group.current.position.z = MathUtils.lerp(group.current.position.z, -0.6, 0.2);
        
        const defaultRotX = 0;
        const defaultRotY = -0.1;
        
        if (animState.current > 0) {
            const speed = weapon === 'glock' ? 15 : 6; 
            animState.current -= delta * speed;
            if (animState.current < 0) animState.current = 0;
            
            const progress = 1.0 - animState.current; 
            const swing = Math.sin(progress * Math.PI); 
            
            if (weapon === 'glock') {
                group.current.rotation.x = defaultRotX + swing * 0.3;
                group.current.rotation.y = defaultRotY;
                group.current.position.z = -0.6 + swing * 0.2; 
            } else {
                group.current.rotation.x = defaultRotX - swing * 1.5; 
                group.current.rotation.y = defaultRotY - swing * 0.5;
                group.current.position.z = -0.6 - swing * 0.4;
            }
        } else {
             group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, defaultRotX, 0.2);
             group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, defaultRotY, 0.2);
        }
    }
  });

  return (
    <group ref={group} position={[0.5, -0.5, -0.6]}>
      <group scale={[1.2, 1.2, 1.2]}>
         <Box args={[0.2, 0.2, 0.8]} color={MAT_SKIN} pos={[0, 0, 0.2]} />
         <group position={[0, 0.1, -0.3]} rotation={[0, 0, 0]}> 
            {weapon === 'glock' && (
                <group rotation={[0, Math.PI, 0]} scale={[2, 2, 2]}>
                    <VoxelGlock />
                </group>
            )}
            {weapon === 'axe' && (
                <group rotation={[0, Math.PI, 0]} position={[0, 0.3, 0]} scale={[2, 2, 2]}> 
                    <VoxelAxe />
                </group>
            )}
            {weapon === 'machete' && (
                <group rotation={[0, Math.PI, 0]} position={[0, 0.3, 0]} scale={[2, 2, 2]}>
                    <VoxelMachete />
                </group>
            )}
            {weapon === 'bat' && (
                <group position={[0, 0.3, 0]} scale={[2, 2, 2]}>
                     <VoxelBat />
                </group>
            )}
         </group>
      </group>
    </group>
  );
};