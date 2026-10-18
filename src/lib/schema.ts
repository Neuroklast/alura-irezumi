import { z } from "zod";
const image = z
  .string()
  .max(4_200_000)
  .refine(
    (v) =>
      /^\/art\/[a-z0-9-]+\.svg$/.test(v) ||
      /^https:\/\//.test(v) ||
      /^data:image\/(png|jpeg|webp);base64,/.test(v),
    "Ungültige Bildquelle",
  );
export const artworkSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
  category: z.enum(["tattoo", "mirror", "motif"]),
  image,
  description: z.string().max(600),
  available: z.boolean(),
});
export const sceneSchema = z.object({
  motif: z
    .enum(["mew", "espeon", "marowak", "vaporeon", "moth", "bloom", "serpent"])
    .transform((value) =>
      value === "moth"
        ? "mew"
        : value === "bloom"
          ? "espeon"
          : value === "serpent"
            ? "vaporeon"
            : value,
    ),
  surface: z.number().min(0).max(100),
  speed: z.number().min(0.5).max(2),
  glow: z.number().min(0).max(1),
  customImage: image.optional(),
});
export const contentSchema = z.object({
  artist: z.string().trim().min(1).max(80),
  bio: z.string().max(2000),
  instagram: z
    .string()
    .url()
    .refine((v) => new URL(v).hostname === "www.instagram.com"),
  scene: sceneSchema,
  works: z.array(artworkSchema).max(60),
});
export type Content = z.infer<typeof contentSchema>;
export type Artwork = z.infer<typeof artworkSchema>;
export type Scene = z.infer<typeof sceneSchema>;
