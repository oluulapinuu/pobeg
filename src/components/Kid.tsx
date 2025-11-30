
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Group, Vector3, Box3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { useGameStore } from '../store';
import { audioService } from '../services/audioService';

const KID_PHRASES = [
    "Эй, открывай давай! Там мужики стучат, чё ты как лох прячешься?!",
    "Дед сказал открыть, а ты чё, ссышь что ли? Ха-ха, трусливый!",
    "Там дядьки с повесткой! Открывай, я тоже посмотреть хочу!",
    "Мам, он не открывает! Скажи ему, что он мудак и пусть открывает!",
    "Дверь ломать будут щас! Давай быстрее, я в тикток снять хочу!",
    "Там военные! Открывай, а то они тебя через окно вытащат, лошара!",
    "Я им сказал, что ты дома! Теперь открывай, а то пиздец тебе!",
    "Ха-ха, тебя в армию заберут! Открывай, я им помогу тебя вытащить!",
    "Чё ты там сидишь как крыса? Дверь открой, там весело будет!",
    "Дед орёт, что щас ломать будет! Давай-давай открывай, я уже снимаю!"
];

// Physics Group
const GROUP_SCENE = 1;

export const Kid: React.FC = () => {
    const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/oluulapinuu/vv@main/kid.glb');
    const modelRef = useRef<Group>(null);
    const { gameStarted, isGameOver, setMessage, voenkomState } = useGameStore();

    // Physics body (static) so player can't walk through him
    // Positioned at Z=8.5 (Window is at Z=10, Player starts at Z=5)
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [0, 0.7, 8.5], 
        rotation: [0, Math.PI, 0], // Facing the player (towards -Z)
        args: [0.6, 1.4, 0.6],
        collisionFilterGroup: GROUP_SCENE
    }));

    // Logic State
    const speechTimer = useRef(5.0); // Initial delay
    const jumpTimer = useRef(Math.random() * 2 + 1);
    const isJumping = useRef(false);
    const jumpProgress = useRef(0);

    // Initialize Model Scale
    useEffect(() => {
        if (scene) {
            const box = new Box3().setFromObject(scene);
            const size = new Vector3();
            box.getSize(size);
            
            // Target height ~1.3m (10 year old child size)
            // Voenkom is ~2.55m, so this is roughly half size.
            const targetHeight = 1.3;
            const scaleFactor = targetHeight / size.y;
            
            scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            // Center pivot
            const center = new Vector3();
            box.getCenter(center);
            
            scene.position.x = -center.x * scaleFactor;
            scene.position.z = -center.z * scaleFactor;
            scene.position.y = -box.min.y * scaleFactor;

            scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
    }, [scene]);

    useFrame((state, delta) => {
        if (!gameStarted || isGameOver) return;
        if (!modelRef.current) return;

        // --- JUMPING LOGIC ---
        // Jumps lightly 2/10 of height (~0.25 units)
        if (isJumping.current) {
            jumpProgress.current += delta * 4; // Jump speed
            if (jumpProgress.current >= Math.PI) {
                isJumping.current = false;
                jumpProgress.current = 0;
                modelRef.current.position.y = 0;
                jumpTimer.current = Math.random() * 3 + 2;
            } else {
                modelRef.current.position.y = Math.sin(jumpProgress.current) * 0.25;
            }
        } else {
            jumpTimer.current -= delta;
            if (jumpTimer.current <= 0) {
                isJumping.current = true;
            }
        }

        // --- SPEAKING LOGIC ---
        // Only speak if Voenkom is not aggressively attacking or chasing (too noisy)
        // And check browser speech synthesis status
        if (voenkomState !== 'attacking' && voenkomState !== 'chasing' && voenkomState !== 'dead') {
            speechTimer.current -= delta;
            
            if (speechTimer.current <= 0) {
                const isBrowserSpeaking = (window as any).speechSynthesis.speaking;
                
                if (!isBrowserSpeaking) {
                    const phrase = KID_PHRASES[Math.floor(Math.random() * KID_PHRASES.length)];
                    // High pitch (1.4), slightly fast (1.1) to simulate child voice
                    audioService.speak(phrase, 0.8, 1.1, 1.4);
                    setMessage(`РЕБЕНОК: "${phrase}"`);
                    
                    // Reset timer (15 - 25 seconds)
                    speechTimer.current = 15 + Math.random() * 10;
                } else {
                    // Try again in 2 seconds if someone is talking
                    speechTimer.current = 2;
                }
            }
        }
    });

    return (
        <group ref={ref as any}>
            <group ref={modelRef}>
                <primitive object={scene} />
            </group>
        </group>
    );
};
