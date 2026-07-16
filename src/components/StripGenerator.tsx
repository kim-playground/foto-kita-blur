'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Calendar, Check, Sparkles, AlertCircle } from 'lucide-react';
import { generateStripDataUrl, STRIP_THEMES } from '@/utils/strip';
import confetti from 'canvas-confetti';

interface StripGeneratorProps {
  photos: string[];
  onRetake: () => void;
}

export const StripGenerator: React.FC<StripGeneratorProps> = ({ photos, onRetake }) => {
  const [selectedTheme, setSelectedTheme] = useState('polaroid');
  const [caption, setCaption] = useState('vibes ✌️');
  const [showDate, setShowDate] = useState(true);
  const [stripDataUrl, setStripDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    // Standard burst
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#db2777', '#f43f5e', '#a855f7', '#60a5fa'],
    });

    // Side cannons for a premium look
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#db2777', '#f43f5e'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f43f5e', '#60a5fa'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);

  // Update strip canvas preview when customization options change
  useEffect(() => {
    let active = true;

    const renderStrip = async () => {
      setIsGenerating(true);
      try {
        const url = await generateStripDataUrl(photos, selectedTheme, caption, showDate);
        if (active) {
          setStripDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate strip canvas:', err);
      } finally {
        if (active) {
          setIsGenerating(false);
        }
      }
    };

    renderStrip();

    return () => {
      active = false;
    };
  }, [selectedTheme, caption, showDate, photos]);

  const handleDownload = () => {
    if (!stripDataUrl) return;

    const link = document.createElement('a');
    link.href = stripDataUrl;
    link.download = `foto-kita-blur-strip-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Download visual feedback
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);

    // Fire minor confetti burst
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#db2777', '#10b981'],
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 bg-transparent min-h-[92vh] flex flex-col justify-center">
      {/* Celebration Header */}
      <div className="text-center mb-10 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-xs font-black text-pink-600 mb-4 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Shoot Complete!</span>
        </motion.div>
        
        <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-zinc-950 mb-2">
          Your Photostrip is Ready
        </h2>
        <p className="text-zinc-500 text-sm md:text-base font-bold">
          Customize your strip template, add a caption, and save the memory.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Strip Preview */}
        <div className="md:col-span-6 flex justify-center order-2 md:order-1">
          <div className="relative bg-white border-2 border-black rounded-[28px] p-6 w-full max-w-[340px] shadow-[6px_6px_0px_rgba(0,0,0,0.15)] flex flex-col items-center">
            
            {/* Strip Image container */}
            <div className="relative w-full aspect-[8/18.7] rounded-2xl overflow-hidden bg-zinc-50 border-2 border-black shadow-inner">
              {isGenerating && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin mb-2" />
                  <span className="text-xs text-zinc-500 font-bold">Rendering details...</span>
                </div>
              )}
              
              {stripDataUrl ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  src={stripDataUrl}
                  alt="Generated Photostrip"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <AlertCircle className="w-10 h-10 mb-2" />
                  <span className="text-xs font-black font-display uppercase tracking-wider">Preview failed to generate</span>
                </div>
              )}
            </div>
            
            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mt-4">
              High Resolution PNG Preview
            </p>
          </div>
        </div>

        {/* Right Side: Customization Options */}
        <div className="md:col-span-6 flex flex-col gap-6 order-1 md:order-2">
          
          {/* Card 1: Select Layout / Theme */}
          <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-sm">
            <h3 className="text-zinc-950 font-black text-sm mb-4 font-display uppercase tracking-wider">
              1. Choose Theme
            </h3>
            
            <div className="flex flex-col gap-2.5">
              {STRIP_THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'border-black bg-pink-50 shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                        : 'border-zinc-200 bg-white hover:border-black hover:shadow-[2px_2px_0px_#000000]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Preview Badge */}
                      <div
                        className="w-5 h-5 rounded-md border-2 border-black/10"
                        style={{
                          background: Array.isArray(theme.background)
                            ? `linear-gradient(to right, ${theme.background[0]}, ${theme.background[1]})`
                            : theme.background,
                        }}
                      />
                      <span className={`text-sm ${isSelected ? 'text-zinc-950 font-black' : 'text-zinc-500 font-bold'}`}>
                        {theme.name}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-pink-500 border-2 border-black flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Custom Text Caption */}
          <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-sm">
            <h3 className="text-zinc-950 font-black text-sm mb-4 font-display uppercase tracking-wider">
              2. Caption & Details
            </h3>

            <div className="flex flex-col gap-4">
              {/* Caption Input */}
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                  Handwriting Caption
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={20}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Type caption..."
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-black text-zinc-950 placeholder-zinc-300 focus:outline-none focus:shadow-[2.5px_2.5px_0px_#000000] transition-all text-sm font-bold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 text-xs font-bold">
                    {caption.length}/20
                  </div>
                </div>
              </div>

              {/* Show Date Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border-2 border-black/10 bg-zinc-50 mt-2 text-left">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-pink-500 shrink-0" />
                  <div>
                    <h4 className="text-sm text-zinc-950 font-black leading-none mb-1">Add Date Tag</h4>
                    <p className="text-[9px] text-zinc-400 leading-none font-bold">Print today's date at the footer</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDate(!showDate)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border-2 border-black ${
                    showDate ? 'bg-pink-500' : 'bg-zinc-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full border-2 border-black shadow-sm transform transition-transform duration-300 ${
                      showDate ? 'translate-x-[20px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mt-2">
            
            {/* Download PNG Button */}
            <motion.button
              onClick={handleDownload}
              disabled={isGenerating || !stripDataUrl}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4.5 rounded-2xl border-2 border-black ${
                downloadSuccess
                  ? 'bg-emerald-500 text-white shadow-[3px_3px_0px_#000000]'
                  : 'bg-pink-500 hover:bg-pink-600 text-white shadow-[3px_3px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px]'
              } font-black text-base flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Downloaded Successfully!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Strip PNG</span>
                </>
              )}
            </motion.button>

            {/* Retake Button */}
            <motion.button
              onClick={onRetake}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-50 border-2 border-black text-zinc-900 font-black text-base flex items-center justify-center gap-2.5 shadow-[3px_3px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photos</span>
            </motion.button>

          </div>

        </div>

      </div>
    </div>
  );
};
