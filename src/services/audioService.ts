


class AudioService {
  ctx: any = null;
  synth: any = (window as any).speechSynthesis;

  init() {
    if (!this.ctx) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- PROCEDURAL SOUNDS ---

  playKnock(intensity: number) {
     // Deprecated for main loop, kept for melee hit
     this.playKnockSound();
  }
  
  // Melee Swing / Miss
  playWoosh() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playGunshot() {
    if (!this.ctx) this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.2);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playHit() {
    if (!this.ctx) this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.1);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playWallHit() {
    if (!this.ctx) this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Dull thud for hitting wall
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- FILE BASED SOUNDS ---

  playKnockSound() {
      this.playMusic('https://cdn.jsdelivr.net/gh/oluulapinuu/vv@main/door.mp3', 1.0);
  }

  playDoorBell() {
      this.playMusic('https://cdn.jsdelivr.net/gh/oluulapinuu/vv@main/zvondoor.mp3', 0.8);
  }

  playScarySound() {
      this.playMusic('https://cdn.jsdelivr.net/gh/oluulapinuu/vv@main/scary.mp3', 0.6);
  }

  playMusic(url: string, vol: number = 0.5) {
      // FIX: Cannot find name 'Audio'. Access it through the window object to resolve the missing DOM type definition.
      const audio = new (window as any).Audio(url);
      audio.volume = vol;
      audio.play().catch(e => console.error("Audio play failed", e));
  }
  
  getDuration(text: string): number {
      // Crude estimate: 80ms per character
      return text.length * 80;
  }

  stopSpeaking() {
      if (this.synth) {
          this.synth.cancel(); 
      }
  }

  speak(text: string, volume: number = 1, rate: number = 1, pitch: number = 0.5) {
    this.stopSpeaking();

    setTimeout(() => {
        const SpeechSynthesisUtterance = (window as any).SpeechSynthesisUtterance;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = volume;
        utterance.rate = rate; 
        utterance.pitch = pitch; 
        
        let voices = this.synth.getVoices();
        
        if (voices.length === 0) {
             setTimeout(() => {
                 voices = this.synth.getVoices();
                 this.speakInternal(utterance, voices);
             }, 100);
        } else {
             this.speakInternal(utterance, voices);
        }
    }, 10);
  }

  speakInternal(utterance: any, voices: any[]) {
      const ruVoice = voices.find((v: any) => v.lang === 'ru-RU' && v.name.includes('Google')) || 
                      voices.find((v: any) => v.lang.includes('ru'));
      
      if (ruVoice) {
          utterance.voice = ruVoice;
          utterance.lang = 'ru-RU';
      }
      this.synth.speak(utterance);
  }
}

export const audioService = new AudioService();