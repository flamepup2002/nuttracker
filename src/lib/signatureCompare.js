// Compares two base64 PNG signature images and returns a similarity score (0..1).
// Uses downscaling to a fixed size + Jaccard similarity over binarized ink masks.

async function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function toInkMask(img, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const darkness = 1 - (r + g + b) / (3 * 255);
    mask[i] = darkness > 0.3 ? 1 : 0;
  }
  return mask;
}

function jaccard(a, b) {
  let inter = 0;
  let union = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) union++;
    if (a[i] && b[i]) inter++;
  }
  if (union === 0) return 0;
  return inter / union;
}

export async function compareSignatures(sigA, sigB, width = 140, height = 56) {
  try {
    const [imgA, imgB] = await Promise.all([loadImage(sigA), loadImage(sigB)]);
    const maskA = toInkMask(imgA, width, height);
    const maskB = toInkMask(imgB, width, height);
    return jaccard(maskA, maskB);
  } catch (e) {
    return 0;
  }
}