import { UploadedImage, UploadedVideo } from "@/types/types";

/**
 * Upload a single image to Cloudinary
 *
 * Returns basic info about the uploaded image
 */
export async function uploadImage(
  file: File,
  folder = "social-publishing/images"
): Promise<UploadedImage> {
  const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset || !cloudName) {
    throw new Error("Cloudinary environment variables are missing");
  }

  /**
   * Create form data for Cloudinary upload
   */
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);

  /**
   * Send upload request to Cloudinary
   */
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: fd,
    }
  );

  /**
   * If upload fails, throw the real error message if available
   */
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Image upload failed");
  }

  const data = await res.json();

  /**
   * Return normalized image data
   */
  return {
    kind: "image",
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}

/**
 * Upload multiple images one by one
 *
 * onProgress can be used to track upload progress
 */
export async function uploadManyImages(
  files: File[],
  onProgress?: (done: number, total: number) => void
) {
  const out: UploadedImage[] = [];

  for (let i = 0; i < files.length; i++) {
    /**
     * Upload each image
     */
    out.push(await uploadImage(files[i]));

    /**
     * Report progress if callback exists
     */
    onProgress?.(i + 1, files.length);
  }

  return out;
}

/**
 * Upload a video to Cloudinary
 *
 * Returns basic info about the uploaded video
 */
export async function uploadVideo(
  file: File,
  folder = "social-publishing/videos"
): Promise<UploadedVideo> {
  const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset || !cloudName) {
    throw new Error("Cloudinary environment variables are missing");
  }

  /**
   * Create form data for Cloudinary upload
   */
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);

  /**
   * Send upload request to Cloudinary
   */
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    {
      method: "POST",
      body: fd,
    }
  );

  /**
   * If upload fails, throw the real error message if available
   */
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Video upload failed");
  }

  const data = await res.json();

  /**
   * Return normalized video data
   */
  return {
    kind: "video",
    url: data.secure_url,
    publicId: data.public_id,
    duration: data.duration,
    format: data.format,
    bytes: data.bytes,
  };
}