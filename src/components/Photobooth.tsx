"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playShutterSound } from "@/utils/audio";

// How long (ms) the peace sign must be held continuously before an automatic capture fires.
const HOLD_DURATION_MS = 1000;

// Y2K/Korean Photobooth Filter Presets
const FILTERS = [
  { id: "none", name: "None", filterCss: "none" },
  { id: "soft-glow", name: "Soft Glow", filterCss: "brightness(1.08) saturate(1.15) contrast(0.95)" },
  { id: "vintage", name: "Vintage", filterCss: "sepia(0.25) contrast(1.1) brightness(0.98)" },
  { id: "bw", name: "B&W", filterCss: "grayscale(1) contrast(1.25) brightness(1.02)" },
  { id: "retro-pink", name: "Retro Pink", filterCss: "sepia(0.1) saturate(1.3) hue-rotate(-15deg) brightness(1.05)" },
  { id: "warm-tone", name: "Warm Tone", filterCss: "sepia(0.15) saturate(1.25) brightness(1.02)" },
  { id: "dreamy-blue", name: "Dreamy Blue", filterCss: "saturate(0.9) hue-rotate(15deg) brightness(1.05)" },
  { id: "peachy", name: "Peachy", filterCss: "saturate(1.35) contrast(1.05) hue-rotate(5deg)" },
];

interface PhotoboothProps {
  onPhotosCaptured: (photos: string[]) => void;
  onBack: () => void;
}

export const Photobooth: React.FC<PhotoboothProps> = ({
  onPhotosCaptured,
  onBack,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<any>(null);
  const animationFrameId = useRef<number | null>(null);

  // Refs to clean up timeouts and prevent leak-based double-captures (Strict Mode safe)
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCountdownActive = useRef<boolean>(false);
  const isCooldownRef = useRef<boolean>(false);
  const photosCountRef = useRef<number>(0);

  // Timestamp (performance.now()) of when the peace sign was first seen in the
  // current continuous hold. null means "not currently holding".
  const holdStartTimeRef = useRef<number | null>(null);

  // UI States
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Photobooth Flow States
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [gestureDetected, setGestureDetected] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [lastCapturedPreview, setLastCapturedPreview] = useState<string | null>(
    null,
  );
  
  // Custom Filter State
  const [activeFilter, setActiveFilter] = useState("none");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Challenge Blur Mode Toggle State
  const [challengeMode, setChallengeMode] = useState(true);
  const challengeModeRef = useRef(true);
  challengeModeRef.current = challengeMode;

  // Sync refs with state immediately on render to ensure frame loop has real-time values
  isCooldownRef.current = isCooldown;
  photosCountRef.current = capturedPhotos.length;

  // Find active filter CSS property
  const activeFilterObj = FILTERS.find((f) => f.id === activeFilter);
  const activeFilterCss = activeFilterObj ? activeFilterObj.filterCss : "none";

  // Combine custom filters with isBlurred state (to prevent active filter style from overriding blur filters in inline CSS)
  const combinedVideoFilter = () => {
    const filterPart = activeFilterCss === "none" ? "" : activeFilterCss;
    const blurPart = isBlurred ? "blur(36px)" : "";
    const combined = [filterPart, blurPart].filter(Boolean).join(" ");
    return combined || "none";
  };

  // Initialize MediaPipe and Webcam
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isComponentMounted = true;

    const setupMediaPipeAndCamera = async () => {
      try {
        // Load MediaPipe dependencies dynamically on client side
        const { GestureRecognizer, FilesetResolver } =
          await import("@mediapipe/tasks-vision");

        if (!isComponentMounted) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
        );

        if (!isComponentMounted) return;

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2, // Support detecting up to two hands at once
        });

        if (!isComponentMounted) {
          recognizer.close(); // Clean up if unmounted during loading
          return;
        }

        recognizerRef.current = recognizer;
        setModelLoading(false);
      } catch (err: any) {
        console.error("Failed to load MediaPipe:", err);
        if (isComponentMounted) {
          setModelError(
            "Could not initialize hand tracking system. Please check your connection.",
          );
          setModelLoading(false);
        }
      }

      // Setup Webcam Stream
      try {
        if (!isComponentMounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        if (!isComponentMounted) {
          // If the component has unmounted while getting webcam permissions, stop stream tracks immediately
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isComponentMounted) {
              setCameraActive(true);
            } else {
              stream.getTracks().forEach((track) => track.stop());
            }
          };
        }
      } catch (err: any) {
        console.error("Camera access denied:", err);
        if (isComponentMounted) {
          setCameraError(
            "Permission denied. Please grant camera access in your settings.",
          );
        }
      }
    };

    setupMediaPipeAndCamera();

    return () => {
      isComponentMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Clean up all running background timeouts to prevent duplicate capturing
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = null;
      }
      isCountdownActive.current = false;
      holdStartTimeRef.current = null;
    };
  }, []);

  // Run the detection loop once the model and camera are ready
  useEffect(() => {
    if (modelLoading || modelError || !cameraActive || !recognizerRef.current)
      return;

    const detectGestures = () => {
      const video = videoRef.current;
      const canvas = canvasOverlayRef.current;
      const recognizer = recognizerRef.current;

      if (!video || !canvas || !recognizer) {
        animationFrameId.current = requestAnimationFrame(detectGestures);
        return;
      }

      // Sync canvas dimensions with video elements
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId.current = requestAnimationFrame(detectGestures);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (video.readyState >= 2) {
        const now = performance.now();
        const results = recognizer.recognizeForVideo(video, now);

        let detected = false;

        // Check all detected hands (up to 2) for the 'Victory' gesture (peace sign).
        if (results.gestures && results.gestures.length > 0) {
          for (let h = 0; h < results.gestures.length; h++) {
            const handGestures = results.gestures[h];
            if (handGestures && handGestures.length > 0) {
              const gestureName = handGestures[0].categoryName;
              const score = handGestures[0].score;

              if (gestureName === "Victory" && score > 0.6) {
                detected = true;
                break;
              }
            }
          }
        }

        setGestureDetected(detected);

        // HOLD-TO-CAPTURE LOGIC (runs directly in the frame loop to avoid React
        // state-queue races). While the pose is held, the camera blurs if challenge mode is ON.
        if (!isCountdownActive.current && !isCooldownRef.current) {
          if (detected && photosCountRef.current < 3) {
            if (holdStartTimeRef.current === null) {
              holdStartTimeRef.current = now;
            }

            if (challengeModeRef.current) {
              setIsBlurred(true);
            }

            const elapsed = now - holdStartTimeRef.current;

            if (elapsed >= HOLD_DURATION_MS) {
              isCountdownActive.current = true;
              holdStartTimeRef.current = null;
              captureSnapshot();
            }
          } else {
            // Hand is down (or already at 3 photos) — cancel any in-progress hold
            holdStartTimeRef.current = null;
            setIsBlurred(false);
          }
        }

        // Draw landmarks overlay if enabled, for every detected hand
        if (
          showLandmarks &&
          results.landmarks &&
          results.landmarks.length > 0
        ) {
          results.landmarks.forEach((landmarks: any) => {
            // Set canvas lines glow properties
            ctx.strokeStyle = "#f43f5e"; // Pink-500
            ctx.lineWidth = 5;
            ctx.lineCap = "round";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(244, 63, 94, 0.4)";

            // Helper to map coordinates
            const getPoint = (idx: number) => ({
              x: landmarks[idx].x * canvas.width,
              y: landmarks[idx].y * canvas.height,
            });

            // Draw joints and fingers
            const drawConnection = (from: number, to: number) => {
              const p1 = getPoint(from);
              const p2 = getPoint(to);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            };

            // Finger paths
            const fingers = [
              [0, 1, 2, 3, 4], // Thumb
              [0, 5, 6, 7, 8], // Index
              [9, 10, 11, 12], // Middle
              [13, 14, 15, 16], // Ring
              [0, 17, 18, 19, 20], // Pinky
            ];

            // Connection bases
            drawConnection(5, 9);
            drawConnection(9, 13);
            drawConnection(13, 17);

            fingers.forEach((finger) => {
              for (let i = 0; i < finger.length - 1; i++) {
                drawConnection(finger[i], finger[i + 1]);
              }
            });

            // Draw landmark dots
            ctx.shadowBlur = 0;
            landmarks.forEach((landmark: any) => {
              const cx = landmark.x * canvas.width;
              const cy = landmark.y * canvas.height;
              ctx.beginPath();
              ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
              ctx.fillStyle = "#db2777"; // Pink-600
              ctx.fill();
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2;
              ctx.stroke();
            });
          });
        }
      }

      animationFrameId.current = requestAnimationFrame(detectGestures);
    };

    animationFrameId.current = requestAnimationFrame(detectGestures);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [modelLoading, modelError, cameraActive, showLandmarks]);

  // Perform camera frame capture (applying active filters to the canvas context)
  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) {
      isCountdownActive.current = false;
      return;
    }

    // Trigger visual flash
    setFlashActive(true);
    if (soundEnabled) {
      playShutterSound();
    }

    // Create a temporary canvas matching the high-quality resolution of the camera
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      // Mirror the output since webcam is mirrored
      tempCtx.translate(tempCanvas.width, 0);
      tempCtx.scale(-1, 1);

      // Apply the active CSS filter to the canvas context!
      tempCtx.filter = activeFilterCss;

      // Draw frame
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      const imgDataUrl = tempCanvas.toDataURL("image/png");

      // Update photo states
      setCapturedPhotos((prev) => {
        const updated = [...prev, imgDataUrl];
        photosCountRef.current = updated.length; // Sync ref immediately
        if (updated.length >= 3) {
          // Transition to the strip page after a short display delay
          setTimeout(() => {
            onPhotosCaptured(updated);
          }, 1500);
        }
        return updated;
      });
      setLastCapturedPreview(imgDataUrl);
    }

    // Cooldown sequence
    setIsCooldown(true);
    isCooldownRef.current = true; // Sync ref immediately
    if (challengeModeRef.current) {
      setIsBlurred(true); // Remain blurred during the cooldown preview phase if challenge mode is active
    }

    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setFlashActive(false);
    }, 500);

    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    cooldownTimeoutRef.current = setTimeout(() => {
      setIsCooldown(false);
      isCooldownRef.current = false; // Sync ref immediately
      setIsBlurred(false); // Clear blur for next pose sequence
      isCountdownActive.current = false; // Reset the gate lock — a fresh 3s hold is required next
      setLastCapturedPreview(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col items-center bg-transparent">
      {/* Flash Overlay */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[9999] pointer-events-none animate-flash"
          />
        )}
      </AnimatePresence>

      {/* Header Info Panel (Styled matching laptop screen header - centered title, no nav status tags) */}
      <div className="w-full bg-white border-2 border-black rounded-2xl p-4 flex items-center justify-center relative mb-6 shadow-sm select-none">
        
        {/* Absolute Left: Challenge Mode Toggle */}
        <div className="absolute left-4">
          <button
            onClick={() => setChallengeMode(!challengeMode)}
            className={`px-3 py-1.5 rounded-xl border-2 border-black font-display font-black text-[10px] tracking-wider transition-all select-none cursor-pointer flex items-center gap-1.5 ${
              challengeMode
                ? 'bg-pink-500 text-white shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000]'
                : 'bg-zinc-100 text-zinc-400 border-zinc-300 hover:border-black hover:text-zinc-800'
            }`}
          >
            <span>⚡ challenge blur</span>
            <span className={`px-1.5 py-0.5 rounded-md border text-[8px] font-extrabold ${
              challengeMode ? 'bg-pink-600 border-pink-700 text-white' : 'bg-zinc-200 border-zinc-300 text-zinc-500'
            }`}>
              {challengeMode ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Centered photos count title */}
        <h3 className="font-display font-black text-lg text-zinc-950 text-center">
          Add your photo ({capturedPhotos.length}/3)
        </h3>

        {/* Absolute Right: Close/Exit trigger */}
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-zinc-50 flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all absolute right-4"
        >
          <X className="w-4 h-4 text-zinc-900" />
        </button>
      </div>

      {/* Main Grid Container (Webcam Left, Preview Slots Right) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Block: Camera Feed Preview (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden bg-zinc-950 border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.15)]">
            
            {/* Loading Overlay */}
            <AnimatePresence>
              {modelLoading && (
                <motion.div
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-50 flex flex-col justify-center items-center p-8 text-center"
                >
                  <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                  <h3 className="text-lg font-black font-display text-zinc-900 mb-2">Initializing Camera...</h3>
                  <p className="text-zinc-500 text-xs max-w-xs leading-relaxed font-bold">
                    Loading gesture recognizer AI models and webcam permissions.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Screens */}
            {(modelError || cameraError) && (
              <div className="absolute inset-0 bg-[#fff8f9] z-50 flex flex-col justify-center items-center p-8 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h3 className="text-lg font-black text-zinc-900 mb-2 font-display">System Connection Error</h3>
                <p className="text-zinc-500 text-xs max-w-md leading-relaxed mb-6 font-bold">
                  {modelError || cameraError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 border-2 border-black text-white font-black rounded-xl transition-all text-xs cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000]"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Live Camera Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ filter: combinedVideoFilter() }}
              className="w-full h-full object-cover scale-x-[-1] transition-all duration-300 ease-out"
            />

            {/* Overlay Landmark Skeleton Canvas */}
            <canvas
              ref={canvasOverlayRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-x-[-1]"
            />


            {/* Gesture Detection Badge Overlay (Top Left inside Feed) */}
            <div className="absolute top-4 left-4 z-20">
              <AnimatePresence>
                {gestureDetected && !isBlurred && !isCooldown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 bg-pink-500 border-2 border-black shadow-[2px_2px_0px_#000000] px-3.5 py-1.5 rounded-xl text-[10px] font-black text-white tracking-wider"
                  >
                    <span className="animate-bounce">✌️</span>
                    <span>PEACE DETECTED</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hold Feedback Overlay (Middle Center inside Feed) */}
            <AnimatePresence>
              {isBlurred && !isCooldown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#7a1827]/10 flex items-center justify-center z-10 pointer-events-none"
                >
                  <div className="bg-white/95 border-2 border-black px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center gap-1">
                    <span className="text-2xl animate-spin">🌫️</span>
                    <span className="font-display font-black text-sm text-[#7a1827]">HOLDING POSE...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Shutter Action button (Bottom Center) */}
            {cameraActive && !modelLoading && (
              <button
                onClick={() => {
                  if (
                    !isCountdownActive.current &&
                    !isCooldownRef.current &&
                    capturedPhotos.length < 3
                  ) {
                    isCountdownActive.current = true;
                    holdStartTimeRef.current = null;
                    setIsBlurred(true);
                    captureSnapshot();
                  }
                }}
                disabled={isBlurred || isCooldown || capturedPhotos.length >= 3}
                className="w-14 h-14 rounded-full bg-pink-500 border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center text-white cursor-pointer absolute bottom-6 left-1/2 -translate-x-1/2 hover:scale-105 active:translate-x-[-50%] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}

            {/* Landmark Toggle Overlay (Bottom Left inside Feed) */}
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className="absolute bottom-6 left-6 z-20 w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-zinc-50 flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all"
            >
              {showLandmarks ? <Eye className="w-4 h-4 text-zinc-900" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
            </button>

            {/* Sound Toggle Overlay (Bottom Right inside Feed) */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="absolute bottom-6 right-6 z-20 w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-zinc-50 flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-900" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
            </button>

            {/* Floating Snapshot preview just captured popup - inside the camera video container at the bottom-right! */}
            <AnimatePresence>
              {lastCapturedPreview && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0, rotate: 10, y: 10 }}
                  animate={{ scale: 1, opacity: 1, rotate: -4, y: 0 }}
                  exit={{ scale: 0.6, opacity: 0, y: 10 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="absolute bottom-20 right-6 z-40 w-32 bg-white border-2 border-black p-2 rounded-xl shadow-[3px_3px_0px_#000000] select-none"
                >
                  <img
                    src={lastCapturedPreview}
                    alt="Captured Snapshot"
                    className="w-full aspect-[4/3] object-cover rounded-lg border border-zinc-200 mb-1"
                  />
                  <div className="font-handwriting text-center text-pink-600 text-xs font-bold leading-none py-0.5">
                    Snapped! 📸
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* 3. Choose a Filter Slider (Row underneath preview) */}
          <div className="w-full bg-white border-2 border-black rounded-2xl p-5 shadow-sm text-left">
            <h4 className="font-display font-black text-sm text-zinc-900 mb-4 tracking-wide">
              Choose a Filter
            </h4>
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none w-full">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center text-2xl relative overflow-hidden select-none ${
                      activeFilter === f.id
                        ? "border-black bg-pink-100 shadow-[3px_3px_0px_#000000] -translate-y-0.5"
                        : "border-zinc-200 bg-white hover:border-black hover:shadow-[2px_2px_0px_#000000]"
                    }`}
                  >
                    {/* Visual filter demo using emoji */}
                    <span 
                      style={{ filter: f.filterCss }}
                      className="transform group-hover:scale-110 transition-transform"
                    >
                      👧
                    </span>
                  </div>
                  <span className={`text-[10px] font-black tracking-wide ${
                    activeFilter === f.id ? "text-pink-600" : "text-zinc-500"
                  }`}>
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Block: Preview Snapshot Slots (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border-2 border-black rounded-2xl p-4.5 text-left shadow-sm">
            <h4 className="font-display font-black text-xs text-zinc-400 tracking-widest uppercase mb-4">
              Captured Snaps
            </h4>
            
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((idx) => {
                const photo = capturedPhotos[idx];
                return (
                  <div key={idx} className="relative w-full aspect-[4/3] rounded-2xl bg-zinc-50 flex items-center justify-center">
                    {photo ? (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_#000000] group">
                        <img
                          src={photo}
                          alt={`Snap ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay success checkmark */}
                        <div className="absolute top-2 right-2 bg-emerald-500 border-2 border-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow select-none">
                          ✓
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center select-none p-4">
                        <span className="text-lg opacity-35 mb-1.5">📸</span>
                        <span className="font-display font-black text-[10px] text-zinc-300 tracking-wider">
                          Photo {idx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>


        </div>

      </div>

    </div>
  );
};
