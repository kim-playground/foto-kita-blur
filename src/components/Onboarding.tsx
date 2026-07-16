'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onStart: () => void;
  onViewThemes: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onStart, onViewThemes }) => {
  return (
    <div className="w-full min-h-[92vh] bg-transparent flex flex-col justify-center items-center py-8 px-4 font-sans">
      
      {/* 2. Hero Section Content Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Area (Content Intro with Playful Typography) */}
        <div className="lg:col-span-5 flex flex-col items-start text-left z-10 select-none">
          {/* Sparkles Pill Tag */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-[10px] font-extrabold text-pink-600 tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin" />
            <span>Capture Your Best Poses in Real-Time ✌️</span>
          </div>

          {/* Heading using the bubbly Fredoka font */}
          <h2 className="font-display font-black text-5xl md:text-6xl text-[#18181b] tracking-tight leading-[1.05] mb-5">
            Keep Your <br />
            <span className="text-pink-500">Cutest</span> <span className="text-blue-500">Vibes! 📸</span>
          </h2>

          {/* Description with a cute, friendly vibe */}
          <p className="text-zinc-600 text-sm md:text-base font-bold leading-relaxed mb-8 max-w-sm">
            Striking a pose is super easy! Simply show a peace sign ✌️ to trigger our magic cinematic AI depth-blur, snap 3 cute frames, and instantly download your custom Y2K photo strips! 🌸
          </p>

          {/* Playful Neobrutalism CTAs */}
          <div className="flex flex-row items-center gap-4.5 w-full">
            <button
              onClick={onStart}
              className="px-6 py-4 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs tracking-wider rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Start Snapping! 🚀</span>
            </button>

            <button
              onClick={onViewThemes}
              className="px-6 py-4 bg-white hover:bg-zinc-50 text-zinc-900 font-black text-xs tracking-wider rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Strip Themes 🎀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Area (2 Floating Polaroid Photo Strips with Y2K Deco) */}
        <div className="lg:col-span-7 flex justify-center items-center relative z-10 w-full min-h-[460px] select-none py-6">
          
          {/* Photostrip 1: Pink border, tilted left */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: 20, rotate: -15 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              y: [0, -10, 0],
              rotate: -6 
            }}
            transition={{
              x: { duration: 0.8, ease: "easeOut" },
              opacity: { duration: 0.8 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-44 bg-[#fee2e2] border-2 border-black p-3.5 rounded-[20px] shadow-[4px_4px_0px_#000000] relative z-10 -mr-6 hover:scale-[1.03] hover:rotate-[-4deg] transition-transform duration-300 cursor-pointer"
          >
            {/* Snap Slots */}
            <div className="flex flex-col gap-2.5 bg-white border border-pink-100 p-2 rounded-xl">
              <div className="aspect-[4/3] rounded-lg bg-pink-50 flex items-center justify-center text-3xl font-bold shadow-inner">
                ✌️
              </div>
              <div className="aspect-[4/3] rounded-lg bg-pink-50 flex items-center justify-center text-3xl font-bold shadow-inner">
                ✨
              </div>
              <div className="aspect-[4/3] rounded-lg bg-pink-50 flex items-center justify-center text-3xl font-bold shadow-inner">
                🥰
              </div>
              {/* Cute Handwriting caption */}
              <div className="text-center font-handwriting text-[#db2777] text-xl font-bold tracking-wide mt-1">
                kawaii vibes
              </div>
            </div>
          </motion.div>

          {/* Photostrip 2: Light Blue border, tilted right, overlapping */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: -20, rotate: 20 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              y: [-12, 0, -12],
              rotate: 8 
            }}
            transition={{
              x: { duration: 0.8, ease: "easeOut" },
              opacity: { duration: 0.8 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-44 bg-[#eff6ff] border-2 border-black p-3.5 rounded-[20px] shadow-[4px_4px_0px_#000000] relative z-20 hover:scale-[1.03] hover:rotate-[6deg] transition-transform duration-300 cursor-pointer"
          >
            {/* Snap Slots */}
            <div className="flex flex-col gap-2.5 bg-white border border-blue-100 p-2 rounded-xl">
              <div className="aspect-[4/3] rounded-lg bg-blue-50 flex items-center justify-center text-3xl font-bold shadow-inner">
                🍨
              </div>
              <div className="aspect-[4/3] rounded-lg bg-blue-50 flex items-center justify-center text-3xl font-bold shadow-inner">
                🧸
              </div>
              <div className="aspect-[4/3] rounded-lg bg-blue-50 flex items-center justify-center text-3xl font-bold shadow-inner">
                🌸
              </div>
              {/* Cute Handwriting caption */}
              <div className="text-center font-handwriting text-[#2563eb] text-xl font-bold tracking-wide mt-1">
                besties 💖
              </div>
            </div>
          </motion.div>

          {/* Decorative Floating Stickers */}
          {/* Heart sticker (Top Left) */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-12 w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0px_#000000]"
          >
            💖
          </motion.div>

          {/* Star sticker (Bottom Right) */}
          <motion.div
            animate={{ y: [0, 8, 0], rotate: [10, -10, 10] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-8 right-16 w-11 h-11 rounded-full bg-white border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_#000000]"
          >
            ⭐
          </motion.div>

          {/* Sparkles (Middle Top) */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute top-14 right-24 text-2xl"
          >
            ✨
          </motion.div>

          {/* Daisy Flower sticker (Middle Left) */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.2, repeat: Infinity }}
            className="absolute bottom-16 left-6 text-3xl"
          >
            🌸
          </motion.div>

        </div>

      </div>

    </div>
  );
};
