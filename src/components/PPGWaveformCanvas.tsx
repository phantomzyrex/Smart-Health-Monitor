import React, { useEffect, useRef } from 'react';

interface PPGWaveformCanvasProps {
  bpm: number;
  isAbnormal?: boolean;
}

export const PPGWaveformCanvas: React.FC<PPGWaveformCanvasProps> = ({ bpm, isAbnormal = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;
    const points: number[] = [];
    const maxPoints = 180;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      // Frequency based on BPM (beats per second)
      const beatsPerSec = Math.max(30, Math.min(220, bpm)) / 60;
      t += 0.05 * (beatsPerSec / 1.2);

      // Generate realistic PPG pulse wave: primary systolic wave + dicrotic notch
      const phase = (t % (2 * Math.PI));
      let wave = 0;
      if (phase < 0.8) {
        // Systolic upstroke & peak
        wave = Math.sin(phase * (Math.PI / 0.8)) * 0.9;
      } else if (phase < 1.3) {
        // Dicrotic notch reflection
        wave = Math.sin((phase - 0.8) * (Math.PI / 0.5)) * 0.35;
      } else {
        // Diastolic decay
        wave = 0.05 * Math.sin(phase * 2);
      }

      points.push(wave);
      if (points.length > maxPoints) {
        points.shift();
      }

      // Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw medical grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center baseline
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw PPG Waveform
      if (points.length > 1) {
        ctx.beginPath();
        const strokeColor = isAbnormal ? '#f43f5e' : '#10b981'; // Rose or Emerald
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;

        const step = width / (maxPoints - 1);
        for (let i = 0; i < points.length; i++) {
          const x = i * step;
          const y = mid - points[i] * (height * 0.42);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bpm, isAbnormal]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      <canvas
        ref={canvasRef}
        width={360}
        height={90}
        className="w-full h-22 block"
        aria-label="MAX30102 PPG Optical Pulse Waveform"
      />
      <div className="absolute bottom-1 right-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>PPG WAVE (IR/RED)</span>
      </div>
    </div>
  );
};
