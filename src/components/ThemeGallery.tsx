'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, ArrowLeft, Sparkles } from 'lucide-react';
import { STRIP_THEMES } from '@/utils/strip';

interface ThemeGalleryProps {
  onStart: () => void;
  onBack: () => void;
}

export const ThemeGallery: React.FC<ThemeGalleryProps> = ({ onStart, onBack }) => {
  return (
    <div className="w-full min-h-[92vh] bg-transparent flex flex-col justify-center items-center py-8 px-4 font-sans select-none">
      
      {/* 1. Gallery Header */}
      <div className="text-center mb-10 max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-xs font-black text-pink-600 mb-4 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
          <span>Strip Template Gallery</span>
        </motion.div>
        
        <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-zinc-950 mb-2">
          Choose Your Vibe 🎀
        </h2>
        <p className="text-zinc-500 text-sm font-bold leading-relaxed">
          Explore our collection of 6 retro & modern border themes. Click on any template to open the camera and start snapping!
        </p>
      </div>

      {/* 2. Side-by-Side Photostrips (Horizontal/Grid Layout) */}
      <div className="w-full max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 justify-center items-stretch mb-12">
        {STRIP_THEMES.map((theme, idx) => {
          const isGradient = Array.isArray(theme.background);
          
          return (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, type: "spring", damping: 12 }}
              onClick={onStart}
              className="group cursor-pointer flex flex-col items-center"
            >
              {/* Vertical Photostrip card */}
              <div
                style={{
                  background: isGradient
                    ? `linear-gradient(to bottom, ${theme.background[0]}, ${theme.background[1]})`
                    : (theme.background as string)
                }}
                className="w-full aspect-[1/2.8] border-2 border-black rounded-[20px] p-3 shadow-[4px_4px_0px_#000000] group-hover:shadow-[6px_6px_0px_#000000] group-hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* 3 Photo slots inside */}
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((slotIdx) => {
                    const emojis = ['✌️', '✨', '🥰'];
                    return (
                      <div
                        key={slotIdx}
                        style={{ borderColor: theme.borderColor }}
                        className="w-full aspect-square rounded-lg border bg-white/70 backdrop-blur-xs flex items-center justify-center text-2xl font-bold shadow-inner"
                      >
                        {emojis[slotIdx]}
                      </div>
                    );
                  })}
                </div>

                {/* Theme Name Footer */}
                <div className="text-center mt-2.5">
                  <div
                    style={{ color: theme.textColor }}
                    className="font-handwriting text-lg font-bold leading-none mb-1 capitalize"
                  >
                    {theme.name.replace('Y2K ', '').replace('Classic ', '').replace('Matte ', '')}
                  </div>
                  <div
                    style={{ color: theme.textColor === '#ffffff' ? 'rgba(255,255,255,0.45)' : 'rgba(24,24,27,0.4)' }}
                    className="text-[7.5px] font-black tracking-widest uppercase leading-none"
                  >
                    FOTO KITA BLUR
                  </div>
                </div>
              </div>

              {/* Select Tag underneath */}
              <span className="text-[10px] font-black text-zinc-400 group-hover:text-pink-500 transition-colors uppercase tracking-widest mt-3.5 select-none">
                Use Frame 📸
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Open Camera / Photobooth button */}
        <button
          onClick={onStart}
          className="px-8 py-4 bg-pink-500 hover:bg-pink-600 border-2 border-black text-white font-black text-xs tracking-wider rounded-2xl shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>Strike a Pose! 🚀</span>
        </button>

        {/* Back to Home button */}
        <button
          onClick={onBack}
          className="px-6 py-4 bg-white hover:bg-zinc-50 border-2 border-black text-zinc-950 font-black text-xs tracking-wider rounded-2xl shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home 🏠</span>
        </button>
      </div>

    </div>
  );
};
