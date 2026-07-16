/**
 * Synthesizes a premium mechanical/electronic camera shutter sound in the browser
 * using the Web Audio API. This avoids latency and missing assets.
 */
export const playShutterSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // 1. White Noise Burst for the "snap/wind" of the shutter
    const bufferSize = ctx.sampleRate * 0.1; // 100ms burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Highpass filter for the crisp metallic sound of the shutter blades
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(9000, ctx.currentTime + 0.05);

    // Fast decay envelope for the snap
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Sine Wave Pitch Sweep for the mechanical click
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.05);

    oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    // Start and play both signals
    noiseNode.start(ctx.currentTime);
    osc.start(ctx.currentTime);

    // Clean up
    noiseNode.stop(ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.warn('Failed to play synthesized shutter sound:', error);
  }
};
