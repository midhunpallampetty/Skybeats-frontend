import React from "react";
import { motion } from "framer-motion";

export const LoadingSpinner = () => {
  // Animation variants
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const pulseVariants = {
    initial: { opacity: 0.3, scale: 0.95 },
    animate: {
      opacity: [0.3, 1, 0.3],
      scale: [0.95, 1, 0.95],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const dotVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
      }
    },
  };

  return (
    <div className="fixed inset-0 loader-backdrop flex items-center justify-center z-50">
      <div className="relative">
        {/* Radial background glow */}
        <div className="absolute inset-0 radial-glow w-96 h-96 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
        
        {/* Glass morphism container */}
        <motion.div 
          className="relative glass-panel rounded-3xl px-16 py-14 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="relative flex items-center justify-center mb-10"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {/* Outer rotating ring */}
            <motion.div
              className="absolute w-32 h-32 rounded-full border border-white/10"
              style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              {/* Small dots on outer ring */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-blue-100/80"
                  style={{
                    left: "50%",
                    top: "0%",
                    transform: `rotate(${i * 30}deg) translateY(-16px) translateX(-50%)`,
                  }}
                  variants={pulseVariants}
                  transition={{ delay: i * 0.1 }}
                />
              ))}
            </motion.div>

            {/* Middle rotating ring */}
            <motion.div
              className="absolute w-24 h-24 rounded-full border border-blue-500/20"
              style={{ boxShadow: "0 0 25px rgba(59, 130, 246, 0.15)" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              {/* Accent dots on middle ring */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-blue-300"
                  style={{
                    left: "50%",
                    top: "0%",
                    transform: `rotate(${i * 45}deg) translateY(-12px) translateX(-50%)`,
                  }}
                  variants={pulseVariants}
                  transition={{ delay: i * 0.15 }}
                />
              ))}
            </motion.div>

            {/* Inner static ring with pulsing effect */}
            <motion.div
              className="w-16 h-16 rounded-full border border-blue-400/30 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 10px rgba(59, 130, 246, 0.2)", "0 0 20px rgba(59, 130, 246, 0.4)", "0 0 10px rgba(59, 130, 246, 0.2)"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Center orb */}
              <motion.div
                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"
                animate={{ 
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 10px rgba(59, 130, 246, 0.4)", 
                    "0 0 20px rgba(59, 130, 246, 0.6)", 
                    "0 0 10px rgba(59, 130, 246, 0.4)"
                  ] 
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Orbiting elements */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                }}
                animate={{
                  x: 40 * Math.cos((i * Math.PI) / 2 + Date.now() * 0.001),
                  y: 40 * Math.sin((i * Math.PI) / 2 + Date.now() * 0.001),
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "mirror",
                }}
              />
            ))}

            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full bg-blue-100/40"
                initial={{ 
                  x: Math.random() * 200 - 100, 
                  y: Math.random() * 200 - 100,
                  opacity: Math.random() * 0.5 + 0.3,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>

          {/* Loading text */}
          <div className="text-center">
            <motion.div
              className="text-sm text-blue-100/80 uppercase tracking-widest font-light mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Loading
            </motion.div>
            
            {/* Animated dots */}
            <motion.div className="flex justify-center space-x-1" variants={containerVariants} initial="initial" animate="animate">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`dot-${i}`}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400/80"
                  variants={dotVariants}
                  animate={{ 
                    opacity: [0.4, 1, 0.4],
                    y: [0, -3, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
