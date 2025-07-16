"use client";

import React from "react";
import { motion } from "framer-motion";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="flex items-center justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.p
          className="mt-6 text-sm font-medium text-gray-600 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Loading;
