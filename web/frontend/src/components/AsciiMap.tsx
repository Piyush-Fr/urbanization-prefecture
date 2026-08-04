"use client";

import React, { useEffect, useRef } from 'react';

const sourceText = "東京大阪京都北海道沖縄富士山桜侍忍者寿司";
const fontSize = 18;

function analyzeCharacters(textString: string, size: number) {
  const chars = [...new Set(textString.split(''))];
  const densityMap: { char: string, density: number }[] = [];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return chars;
  
  canvas.width = size * 2;
  canvas.height = size * 2;
  ctx.font = `${size}px monospace`;
  ctx.textBaseline = "top";

  for (const c of chars) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillText(c, 0, 0);
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixelCount = 0;
    
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i + 3] > 0) {
        pixelCount++;
      }
    }
    
    densityMap.push({ char: c, density: pixelCount });
  }

  densityMap.sort((a, b) => a.density - b.density);
  return densityMap.map(item => item.char);
}

export default function AsciiMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const charArray = analyzeCharacters(sourceText, fontSize);
    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;
    
    let mapData: ImageData | null = null;
    let mapWidth = 0;
    let mapHeight = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    }
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const img = new Image();
    
    let logicalWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    let logicalHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;

    const processImage = () => {
        if (!img.naturalWidth) return;
        const offscreen = document.createElement('canvas');
        // Scale to 85% of screen height
        const scale = (logicalHeight * 0.85) / img.naturalHeight;
        mapWidth = Math.floor(img.naturalWidth * scale);
        mapHeight = Math.floor(img.naturalHeight * scale);
        
        offscreen.width = mapWidth;
        offscreen.height = mapHeight;
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if (offCtx) {
          offCtx.drawImage(img, 0, 0, mapWidth, mapHeight);
          mapData = offCtx.getImageData(0, 0, mapWidth, mapHeight);
        }
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      logicalWidth = window.innerWidth;
      logicalHeight = window.innerHeight;
      
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      if (img.complete && img.naturalWidth > 0) {
          processImage();
      }
    };
    window.addEventListener('resize', resize);
    resize();
    
    let renderStart = 0;

    const render = (time: number) => {
      if (renderStart === 0) renderStart = time;
      const elapsedSec = (time - renderStart) / 1000;
      const revealDuration = 2.0; // 2 seconds to reveal

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      
      if (mapData) {
        // Center the map completely so it acts as a full-screen background
        const offsetX = (logicalWidth - mapWidth) / 2;
        const offsetY = (logicalHeight - mapHeight) / 2;
        const t = time * 0.001;
        
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#d80707"; // Dark red text for maximum visual impact against white
        
        const currentProgress = Math.min(1, elapsedSec / revealDuration);

        for (let y = 0; y < mapHeight; y += fontSize) {
          const rowProgress = y / mapHeight;

          for (let x = 0; x < mapWidth; x += fontSize) {
            // Add randomness for a matrix rain dissolving effect
            const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.15;
            if (rowProgress + noise > currentProgress && currentProgress < 1) {
              continue; // Hasn't revealed yet
            }

            const index = (Math.floor(x) + Math.floor(y) * mapWidth) * 4;
            const a = mapData.data[index + 3];
            
            if (a > 128) {
              const cx = x + offsetX;
              const cy = y + offsetY;
              const distToMouse = Math.hypot(cx - mouseX, cy - mouseY);
              
              const waveX = Math.sin(t + y * 0.05) * 3;
              const waveY = Math.cos(t + x * 0.05) * 3;
              
              let repelX = 0;
              let repelY = 0;
              // Enhanced cursor reactivity: radius 250px, force 60px
              if (distToMouse < 250) {
                const angle = Math.atan2(cy - mouseY, cx - mouseX);
                const force = (250 - distToMouse) / 250 * 60;
                repelX = Math.cos(angle) * force;
                repelY = Math.sin(angle) * force;
              }
              
              const noiseVal = (Math.sin(x * 0.02) + Math.cos(y * 0.02 + t * 0.5) + 2) / 4;
              let charIndex = Math.floor(noiseVal * charArray.length);
              charIndex = Math.max(0, Math.min(charArray.length - 1, charIndex));
              
              ctx.fillText(charArray[charIndex], cx + waveX + repelX, cy + waveY + repelY);
            }
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    img.onload = () => {
      processImage();
    };
    
    img.src = '/img/nihon.png';
    render(0); // Start rendering immediately so we don't wait for onload to start the loop

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-80" />;
}
