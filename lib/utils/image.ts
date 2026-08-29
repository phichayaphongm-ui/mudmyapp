/**
 * Compresses an image file on the client side using the Canvas API.
 * 
 * @param file The original image File object
 * @param maxWidth Maximum width in pixels (default: 1200)
 * @param maxHeight Maximum height in pixels (default: 1200)
 * @param quality JPEG quality from 0 to 1 (default: 0.8)
 * @returns A Promise that resolves to a new compressed File object (JPEG)
 */
export const compressImage = async (
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 1200, 
  quality: number = 0.8
): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(file); // Fallback to original if canvas context is unavailable
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new file with .jpg extension
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original if blob creation fails
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
