/* eslint-disable */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/components/motion-primitives/text-effect';

const CHARACTERS = '東京大阪京都北海道沖縄富士山桜侍忍者寿司ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

interface MatrixTextProps {
  children: React.ReactNode;
  duration?: number; // Total duration to resolve
  delay?: number; // Delay before starting scramble
  className?: string;
  as?: React.ElementType;
}

const ScrambleContext = React.createContext({ total: 100 });

export function MatrixText({ children, duration = 1.5, delay = 0, className, as: Component = 'div' }: MatrixTextProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });
  
  // Recursively process nodes to handle strings and nested elements
  const processNode = (node: React.ReactNode, index: { current: number }): React.ReactNode => {
    if (node === null || node === undefined || typeof node === 'boolean') {
      return null;
    }

    if (typeof node === 'string' || typeof node === 'number') {
      const text = String(node);
      const parts = text.split(/(\s+)/);
      return parts.map((part, i) => {
        if (part.match(/\s+/)) return part; // Keep spaces as is
        
        const chars = part.split('');
        return (
          <span key={`word-${index.current}-${i}`} className="inline-block whitespace-nowrap">
            {chars.map((char, j) => {
              const charIndex = index.current++;
              return (
                <ScrambleChar 
                  key={`char-${charIndex}`} 
                  char={char} 
                  index={charIndex} 
                  inView={isInView} 
                  duration={duration} 
                  delay={delay} 
                />
              );
            })}
          </span>
        );
      });
    }
    
    if (React.isValidElement(node)) {
      const children = (node.props as any).children;
      return React.cloneElement(
        node,
        { ...(node.props as object || {}), key: `node-${index.current++}` } as any,
        ...(children ? (Array.isArray(children) ? children.map(c => processNode(c, index)) : [processNode(children, index)]) : [])
      );
    }
    
    if (Array.isArray(node)) {
      return node.map((c) => processNode(c, index));
    }
    
    return node;
  };
  
  // Two passes: one to count, one to process
  const countRef = { current: 0 };
  const getCount = (node: React.ReactNode): void => {
    if (typeof node === 'string' || typeof node === 'number') {
      const text = String(node);
      const parts = text.split(/(\s+)/);
      parts.forEach(part => {
        if (!part.match(/\s+/)) countRef.current += part.length;
      });
    } else if (React.isValidElement(node)) {
      const children = (node.props as any).children;
      if (children) {
        if (Array.isArray(children)) children.forEach(getCount);
        else getCount(children);
      }
    } else if (Array.isArray(node)) {
      node.forEach(getCount);
    }
  };
  getCount(children);
  const totalChars = countRef.current;

  const index = { current: 0 };
  const processedContent = processNode(children, index);

  return (
    <Component ref={containerRef} className={cn("", className)}>
      <ScrambleContext.Provider value={{ total: totalChars }}>
        {processedContent}
      </ScrambleContext.Provider>
    </Component>
  );
}


function ScrambleChar({ char, index, inView, duration, delay }: { char: string, index: number, inView: boolean, duration: number, delay: number }) {
  const [displayText, setDisplayText] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  const { total } = React.useContext(ScrambleContext);
  
  useEffect(() => {
    if (!inView) {
      setDisplayText('');
      setIsResolved(false);
      return;
    }
    
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    
    timeout = setTimeout(() => {
      // Avoid division by zero, resolve instantly if total is 0
      const resolveTimeMs = total > 0 ? (index / total) * (duration * 1000) : 0;
      const startTime = Date.now();
      
      setDisplayText(CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]);
      
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > resolveTimeMs) {
          setDisplayText(char);
          setIsResolved(true);
          clearInterval(interval);
        } else {
          setDisplayText(CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]);
        }
      }, 50);
      
    }, delay * 1000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [inView, char, index, total, duration, delay]);

  if (!displayText) {
    return <span className="opacity-0">{char}</span>;
  }

  return (
    <span className={cn("inline-block", !isResolved ? "text-[#d80707] font-bold opacity-80" : "")}>
      {displayText}
    </span>
  );
}
