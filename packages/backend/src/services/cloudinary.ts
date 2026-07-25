import { config } from "../config/index.js";

let cloudinaryV2: any = null;

async function getCloudinary() {
  if (!cloudinaryV2 && config.cloudinary.cloudName) {
    const cloudinary = await import("cloudinary");
    cloudinary.v2.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
    cloudinaryV2 = cloudinary.v2;
  }
  return cloudinaryV2;
}

export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<string> {
  const cld = await getCloudinary();
  if (!cld) {
    throw new Error("Cloudinary not configured — photo uploads disabled");
  }

  const { Readable } = await import("stream");

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
        ],
      },
      (error: any, result: any) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}
