/**
 * Utility to generate a high-resolution photobooth strip using HTML Canvas.
 */

export interface StripTheme {
  id: string;
  name: string;
  background: string | string[]; // Single color or gradient [start, end]
  textColor: string;
  borderColor: string;
  fontFamily: string;
}

export const STRIP_THEMES: StripTheme[] = [
  {
    id: 'polaroid',
    name: 'Classic Polaroid',
    background: '#ffffff',
    textColor: '#1e293b',
    borderColor: '#e2e8f0',
    fontFamily: 'Caveat, "Brush Script MT", cursive',
  },
  {
    id: 'obsidian',
    name: 'Matte Obsidian',
    background: '#0c0c0e',
    textColor: '#f8fafc',
    borderColor: '#27272a',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  {
    id: 'capturing-moments',
    name: 'Capturing Moments',
    background: '#7a1827',
    textColor: '#ffffff',
    borderColor: '#ffffff',
    fontFamily: 'Caveat, "Brush Script MT", cursive',
  },
  {
    id: 'lavender',
    name: 'Y2K Lavender',
    background: '#e0d6ff',
    textColor: '#4c1d95',
    borderColor: '#c084fc',
    fontFamily: 'Caveat, "Brush Script MT", cursive',
  },
  {
    id: 'cyber',
    name: 'Cyber Gradient',
    background: ['#3b82f6', '#ec4899'], // Gradient
    textColor: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    fontFamily: 'Outfit, sans-serif',
  },
  {
    id: 'retro-peach',
    name: 'Retro Peach',
    background: '#ffedd5',
    textColor: '#c2410c',
    borderColor: '#fdba74',
    fontFamily: 'Caveat, "Brush Script MT", cursive',
  }
];

// Helper to load an image asynchronously
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

export const generateStripDataUrl = async (
  images: string[],
  themeId: string,
  caption: string = '',
  showDate: boolean = true
): Promise<string> => {
  const theme = STRIP_THEMES.find((t) => t.id === themeId) || STRIP_THEMES[0];

  // Strip Geometry (High Resolution)
  const canvasWidth = 800;
  const photoWidth = 680;
  const photoHeight = 510; // 4:3 Ratio
  const sidePadding = (canvasWidth - photoWidth) / 2; // 60px
  const topPadding = 60;
  const photoGap = 40;
  const bottomPadding = 220;

  // Calculate total canvas height
  // 3 Photos + 2 gaps + top padding + bottom padding
  const canvasHeight = topPadding + (3 * photoHeight) + (2 * photoGap) + bottomPadding;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2D canvas context');
  }

  // 1. Draw Background
  if (Array.isArray(theme.background)) {
    // Draw Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, theme.background[0]);
    gradient.addColorStop(1, theme.background[1]);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = theme.background;
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Load and Draw all Photos
  for (let i = 0; i < images.length && i < 3; i++) {
    const img = await loadImage(images[i]);
    const yPos = topPadding + i * (photoHeight + photoGap);

    ctx.save();
    
    // Add subtle drop shadow to photos for Polaroid/Obsidian aesthetics
    if (theme.id === 'polaroid') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 8;
    } else if (theme.id === 'obsidian') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
    }

    // Draw photo border/stroke container
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(sidePadding, yPos, photoWidth, photoHeight);

    // Clip image to the border container
    ctx.beginPath();
    ctx.rect(sidePadding, yPos, photoWidth, photoHeight);
    ctx.clip();

    // Center-crop image drawing
    const imgRatio = img.width / img.height;
    const targetRatio = photoWidth / photoHeight;
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

    if (imgRatio > targetRatio) {
      sWidth = img.height * targetRatio;
      sx = (img.width - sWidth) / 2;
    } else if (imgRatio < targetRatio) {
      sHeight = img.width / targetRatio;
      sy = (img.height - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, sidePadding, yPos, photoWidth, photoHeight);
    ctx.restore();
  }

  // 3. Draw Branding & Caption Text
  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textCenterY = canvasHeight - (bottomPadding / 2) - 10;

  // Custom User Caption (Large handwriting or display text)
  if (caption.trim()) {
    ctx.font = theme.id === 'polaroid' || theme.id === 'lavender' || theme.id === 'retro-peach' || theme.id === 'capturing-moments'
      ? 'italic 54px Caveat, cursive'
      : '600 40px Outfit, sans-serif';
    ctx.fillText(caption, canvasWidth / 2, textCenterY - 15);
  }

  // Small logo branding: "foto kita blur"
  ctx.font = '500 20px Outfit, sans-serif';
  ctx.letterSpacing = '2px';
  const brandingText = 'FOTO KITA BLUR';
  const brandingY = caption.trim() ? textCenterY + 45 : textCenterY - 10;
  ctx.fillText(brandingText, canvasWidth / 2, brandingY);

  // Date Tag (rendered below logo or offset)
  if (showDate) {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = theme.textColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)';
    ctx.fillText(formattedDate, canvasWidth / 2, brandingY + 30);
  }

  return canvas.toDataURL('image/png');
};
