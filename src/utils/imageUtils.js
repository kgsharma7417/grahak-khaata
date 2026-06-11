// imageUtils.js — Compress image to max ~300KB using Canvas API

/**
 * Compress a File/Blob image to JPEG, max given dimension & quality.
 * Returns a base64 data URL string.
 */
export function compressImage(
  file,
  { maxWidth = 800, maxHeight = 800, quality = 0.7 } = {},
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read failed"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load failed"));
      img.onload = () => {
        // Calculate new dimensions keeping aspect ratio
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Try to get under ~300KB by reducing quality iteratively
        let q = quality;
        let dataUrl = canvas.toDataURL("image/jpeg", q);

        // Rough size check: base64 length * 0.75 = bytes
        while (dataUrl.length * 0.75 > 300 * 1024 && q > 0.2) {
          q -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }

        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
