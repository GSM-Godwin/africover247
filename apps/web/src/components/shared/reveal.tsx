"use client";

import { motion, useReducedMotion } from "framer-motion";

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

  const directionMap = {
    up: { y: shouldReduceMotion ? 0 : 24, x: 0 },
    left: { x: shouldReduceMotion ? 0 : -16, y: 0 },
    right: { x: shouldReduceMotion ? 0 : 16, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
