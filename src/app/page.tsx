'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Onboarding } from '@/components/Onboarding';
import { Photobooth } from '@/components/Photobooth';
import { StripGenerator } from '@/components/StripGenerator';
import { ThemeGallery } from '@/components/ThemeGallery';

type ActiveStep = 'onboarding' | 'photobooth' | 'strip' | 'themes';

export default function Home() {
  const [activeStep, setActiveStep] = useState<ActiveStep>('onboarding');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  // Intercept and suppress TensorFlow/XNNPACK WASM informational stdout/stderr console writes safely on client-side mount
  useEffect(() => {
    const filterNoise = (originalFn: (...args: any[]) => void) => {
      return (...args: any[]) => {
        const msg = args[0];
        if (typeof msg === 'string' && (msg.includes('XNNPACK') || msg.includes('TensorFlow'))) {
          return;
        }
        originalFn(...args);
      };
    };
    console.log = filterNoise(console.log);
    console.info = filterNoise(console.info);
    console.warn = filterNoise(console.warn);
    console.error = filterNoise(console.error);
    setMounted(true);
  }, []);

  const [mounted, setMounted] = useState(false);

  const handleStartPhotobooth = () => {
    setCapturedPhotos([]);
    setActiveStep('photobooth');
  };

  const handlePhotosCaptured = (photos: string[]) => {
    setCapturedPhotos(photos);
    setActiveStep('strip');
  };

  const handleViewThemes = () => {
    setActiveStep('themes');
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setActiveStep('photobooth');
  };

  const handleBackToOnboarding = () => {
    setCapturedPhotos([]);
    setActiveStep('onboarding');
  };

  // Framer Motion slide/fade parameters for smooth page-level transitions
  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.4, ease: 'easeIn' as const } },
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white bg-dot-pattern text-[#3d1d36] font-sans relative overflow-hidden flex flex-col items-center justify-center animate-pulse">
        {/* Background Decorative Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.03),rgba(255,255,255,0))] pointer-events-none" />
        <div className="text-center font-display font-extrabold text-pink-500/20 text-3xl">
          foto kita blur.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white bg-dot-pattern text-[#3d1d36] font-sans relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Decorative Mesh & Blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.03),rgba(255,255,255,0))] pointer-events-none" />
      
      {/* Glowing Neon Blob 1 (Top Left) - Extremely subtle pink */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-100/10 blur-[120px] animate-float-1 pointer-events-none" />

      {/* Glowing Neon Blob 2 (Bottom Right) - Extremely subtle pink */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-100/10 blur-[120px] animate-float-2 pointer-events-none" />

      {/* Step Transition Wrapper */}
      <div className="w-full relative z-10">
        <AnimatePresence mode="wait">
          {activeStep === 'onboarding' && (
            <motion.div
              key="onboarding"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex justify-center"
            >
              <Onboarding onStart={handleStartPhotobooth} onViewThemes={handleViewThemes} />
            </motion.div>
          )}

          {activeStep === 'photobooth' && (
            <motion.div
              key="photobooth"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex justify-center"
            >
              <Photobooth
                onPhotosCaptured={handlePhotosCaptured}
                onBack={handleBackToOnboarding}
              />
            </motion.div>
          )}

          {activeStep === 'strip' && (
            <motion.div
              key="strip"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex justify-center"
            >
              <StripGenerator photos={capturedPhotos} onRetake={handleRetake} />
            </motion.div>
          )}

          {activeStep === 'themes' && (
            <motion.div
              key="themes"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex justify-center"
            >
              <ThemeGallery
                onStart={handleStartPhotobooth}
                onBack={handleBackToOnboarding}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding (Suppressed hydration warning for client/server year format mismatches) */}
      <footer 
        suppressHydrationWarning
        className="w-full text-center py-6 mt-auto text-[10px] tracking-widest text-pink-500/60 relative z-10 border-t border-pink-100/60"
      >
        © {new Date().getFullYear()} FOTO KITA BLUR • Kim Lanisa
      </footer>
    </main>
  );
}
