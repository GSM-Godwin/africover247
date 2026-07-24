"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PolicyCard } from "./policy-card";

export function PolicyCardStack() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      className="relative w-[290px] sm:w-[320px] h-[220px] cursor-default group isolate"
    >
      <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-2xl bg-daybreak/10 blur-2xl scale-110 pointer-events-none" />

      <div
        className="absolute top-0 right-10 rotate-[17deg] scale-[0.96] transition-all duration-300 ease-out group-hover:rotate-[10deg] group-hover:translate-x-2 group-hover:-translate-y-1 w-[260px] sm:w-[290px] h-[180px] rounded-xl bg-midnight/70"
      />

      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -6, 0],
              }
        }
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-4 left-0 rotate-[2deg] transition-all duration-300 ease-out group-hover:rotate-[0deg] group-hover:-translate-y-2 group-hover:border-daybreak"
      >
        <PolicyCard
          cardholderName="Ada Johnson"
          policyNumber="AFC 2026 0001"
          coverage="Motor Comprehensive"
          status="active"
          className="hover:border-daybreak/60 shadow-[0_8px_32px_rgba(16,26,52,0.4)] transition-all duration-300"
        />
      </motion.div>
    </motion.div>
  );
}
