"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "left" | "right";
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.5,
  direction = "up",
  className,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "0px 0px -50px 0px",
  });

  const directionMap = {
    up: { y: shouldReduceMotion ? 0 : 24, x: 0 },
    left: { x: shouldReduceMotion ? 0 : -16, y: 0 },
    right: { x: shouldReduceMotion ? 0 : 16, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...directionMap[direction] }
      }
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
