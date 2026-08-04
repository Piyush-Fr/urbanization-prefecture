'use client';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/components/motion-primitives/text-effect';

interface HighlightProps {
  children: React.ReactNode;
  variant?: 'red' | 'white';
  className?: string;
}

export function Highlight({ children, variant = 'red', className }: HighlightProps) {
  const containerClasses = variant === 'red' ? 'text-white' : 'text-[#d80707]';
  const bgClasses = variant === 'red' ? 'bg-[#d80707]' : 'bg-white';

  return (
    <motion.span
      className={cn(
        "relative inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 overflow-hidden",
        containerClasses,
        className
      )}
      variants={{
        hidden: {},
        visible: {}
      }}
    >
      <motion.span 
        className={cn("absolute inset-0 z-0", bgClasses)}
        variants={{
          hidden: { x: '-101%' },
          visible: { x: '0%', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
        }}
      />
      <span className="relative z-10 font-medium">
        {children}
      </span>
    </motion.span>
  );
}
