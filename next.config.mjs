import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_CLOUDINARY_HERO_VIDEO_URL: optionalUrl,
  NEXT_PUBLIC_CLOUDINARY_WORLD_1_VIDEO_URL: optionalUrl,
  NEXT_PUBLIC_CLOUDINARY_WORLD_2_VIDEO_URL: optionalUrl,
  NEXT_PUBLIC_CLOUDINARY_WORLD_3_VIDEO_URL: optionalUrl,
  NEXT_PUBLIC_CLOUDINARY_WORLD_4_VIDEO_URL: optionalUrl,
  NEXT_PUBLIC_CLOUDINARY_WORLD_5_VIDEO_URL: optionalUrl,
  NEXT_PUBLIC_CLOUDINARY_WORLD_6_VIDEO_URL: optionalUrl,
});

publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CLOUDINARY_HERO_VIDEO_URL:
    process.env.NEXT_PUBLIC_CLOUDINARY_HERO_VIDEO_URL,
  NEXT_PUBLIC_CLOUDINARY_WORLD_1_VIDEO_URL:
    process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_1_VIDEO_URL,
  NEXT_PUBLIC_CLOUDINARY_WORLD_2_VIDEO_URL:
    process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_2_VIDEO_URL,
  NEXT_PUBLIC_CLOUDINARY_WORLD_3_VIDEO_URL:
    process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_3_VIDEO_URL,
  NEXT_PUBLIC_CLOUDINARY_WORLD_4_VIDEO_URL:
    process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_4_VIDEO_URL,
  NEXT_PUBLIC_CLOUDINARY_WORLD_5_VIDEO_URL:
    process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_5_VIDEO_URL,
  NEXT_PUBLIC_CLOUDINARY_WORLD_6_VIDEO_URL:
    process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_6_VIDEO_URL,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.10.226"],
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
