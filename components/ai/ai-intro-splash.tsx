"use client";

import { motion } from "framer-motion";

export function AiIntroSplash() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      aria-hidden
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center"
      >
        <img
          src="/gif/ai.gif"
          alt=""
          width={224}
          height={224}
          decoding="async"
          className="h-52 w-52 rounded-full object-cover sm:h-60 sm:w-60 md:h-64 md:w-64"
        />
      </motion.div>
    </motion.div>
  );
}
