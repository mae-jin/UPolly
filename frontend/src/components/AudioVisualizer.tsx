import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRef,
  isPlaying,
  currentTime = 0,
  duration = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw waveform visualization
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(0, height / 2 - 1, width, 2);
      
      if (isPlaying) {
        // Animated waveform bars
        const barCount = 50;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.sin((currentTime * 10 + i * 0.5)) * 20 + 25;
          const x = i * barWidth;
          const y = (height - Math.abs(barHeight)) / 2;
          
          ctx.fillStyle = i < (currentTime / duration) * barCount ? '#3B82F6' : '#D1D5DB';
          ctx.fillRect(x, y, barWidth - 1, Math.abs(barHeight));
        }
      } else {
        // Static progress bar
        const progressWidth = (currentTime / duration) * width;
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(0, height / 2 - 2, progressWidth, 4);
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, duration]);

  return (
    <div className="w-full h-16 bg-gray-50 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={64}
        className="w-full h-full"
      />
    </div>
  );
};