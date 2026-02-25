import { supabase } from "@/integrations/supabase/client";

/**
 * Compress an image file to JPEG, resize to max dimension, and return as Blob.
 */
function compressToBlob(file: File, maxDim = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Failed to compress image"));
        },
        "image/jpeg",
        0.75
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Upload a photo to cloud storage and return the public URL.
 */
export async function uploadMealPhoto(file: File): Promise<string> {
  const blob = await compressToBlob(file);
  const fileName = `${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("meal-photos")
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("meal-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Upload from a base64 data URL (used by bulk import after canvas compression).
 */
export async function uploadMealPhotoFromDataUrl(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const fileName = `${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("meal-photos")
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("meal-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
