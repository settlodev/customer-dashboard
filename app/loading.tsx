"use client";

import React from "react";
import { motion } from "framer-motion";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative"
      >
        <div className="flex items-center justify-center space-x-6">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-gradient-to-r from-green-500 via-green-500 to-emerald-500 rounded-full shadow-lg"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 1, 0.6],
                y: [0, -12, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: index * 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          ))}
        </div>

        <motion.p
          className="mt-8 text-sm font-semibold text-slate-600 text-center tracking-wide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Loading;
