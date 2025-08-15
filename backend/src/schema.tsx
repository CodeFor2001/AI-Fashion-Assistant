import { z } from "zod";

export const FiltersSchema = z.object({
  colors: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  sizes: z.array(z.string()).optional()
});

export const OwnedItemSchema = z.object({
  type: z.enum(["top","bottom","dress","outerwear","shoes","accessory"]),
  name: z.string(),
  color: z.string().optional(),
  size: z.string().optional(),
  style: z.string().optional()
});

export const SuggestOutfitsRequestSchema = z.object({
  description: z.string().min(5, "Please describe your outfit, occasion, weather, or vibe."),
  ownedItems: z.array(OwnedItemSchema).optional(),
  filters: FiltersSchema.optional(),
  count: z.number().int().min(1).max(5).default(3)
});

export const OutfitItemSchema = z.object({
  type: z.enum(["top","bottom","dress","outerwear","shoes","accessory"]),
  name: z.string(),
  color: z.string().optional(),
  size: z.string().optional(),
  priceHint: z.string().optional(),
  notes: z.string().optional()
});

export const OutfitSuggestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string(),
  items: z.array(OutfitItemSchema).min(1),
  pinterestSearchPhrases: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional(),
  estPriceRange: z.object({ min: z.number(), max: z.number() }).optional()
});

export const SuggestOutfitsResponseSchema = z.object({
  suggestions: z.array(OutfitSuggestionSchema).min(1)
});

export const SearchImagesQuerySchema = z.object({
  phrase: z.string().min(2),
  count: z.coerce.number().int().min(1).max(5).default(2),
  safe: z.coerce.boolean().default(true)
});

export const ImageResultSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  source: z.string().optional(),
  thumbnail: z.string().url().optional()
});

export const SearchImagesResponseSchema = z.object({
  images: z.array(ImageResultSchema)
});

export const BuyLinksQuerySchema = z.object({
  item: z.string().min(2),
  color: z.string().optional(),
  size: z.string().optional(),
  budget: z.coerce.number().optional()
});

export const BuyLinkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  retailer: z.string(),
  price: z.number().optional(),
  currency: z.string().default("USD"),
  availability: z.enum(["in_stock","limited","out_of_stock"]).optional()
});

export const BuyLinksResponseSchema = z.object({
  links: z.array(BuyLinkSchema).min(1)
});
