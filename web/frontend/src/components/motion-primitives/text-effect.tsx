/* eslint-disable */
'use client';
import { motion, Variants } from 'framer-motion';
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TextEffectProps = {
  children: React.ReactNode;
  per?: 'word' | 'char';
  as?: keyof React.JSX.IntrinsicElements;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  className?: string;
  preset?: 'blur' | 'fade' | 'slide' | 'scale';
  delay?: number;
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(4px)', y: 10 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function TextEffect({
  children,
  per = 'word',
  as = 'p',
  variants,
  className,
  preset = 'blur',
  delay = 0,
}: TextEffectProps) {
  const MotionTag = motion[as as keyof typeof motion] as any;

  const defaultContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
  };

  // Recursively process children, splitting strings into animatable words/chars
  const processNode = (node: React.ReactNode, keyPrefix: string = ''): React.ReactNode[] => {
    if (node === null || node === undefined || typeof node === 'boolean') {
      return [];
    }

    if (typeof node === 'string' || typeof node === 'number') {
      const text = String(node);
      const words = text.split(/(\s+)/); // keep whitespace
      return words.map((word, i) => {
        if (word.match(/\s+/)) {
          return <span key={`${keyPrefix}-${i}`}>{word}</span>;
        }
        
        if (per === 'char') {
          return (
            <span key={`${keyPrefix}-${i}`} className="inline-block whitespace-nowrap">
              {word.split('').map((char, charIndex) => (
                <motion.span key={charIndex} variants={variants?.item || defaultItemVariants} className="inline-block">
                  {char}
                </motion.span>
              ))}
            </span>
          );
        }

        return (
          <motion.span key={`${keyPrefix}-${i}`} variants={variants?.item || defaultItemVariants} className="inline-block">
            {word}
          </motion.span>
        );
      });
    }
    
    if (React.isValidElement(node)) {
      const children = (node.props as any).children;
      return [
        React.cloneElement(
          node,
          { key: `${keyPrefix}-node` } as any,
          ...(children ? processNode(children, `${keyPrefix}-child`) : [])
        ),
      ];
    }
    
    if (Array.isArray(node)) {
      return node.flatMap((child, i) => processNode(child, `${keyPrefix}-${i}`));
    }
    
    return [node];
  };

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={variants?.container || defaultContainerVariants}
      className={cn('', className)}
    >
      {processNode(children)}
    </MotionTag>
  );
}
