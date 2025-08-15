import { Router } from "express";
import { z } from "zod";
import { openai } from "../lib/openai.js";
import {
  SuggestOutfitsRequestSchema,
  SuggestOutfitsResponseSchema,
} from "../schema.js";

export const suggestRouter = Router();

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_SUGGESTIONS = 4;

/* ---------- helpers ---------- */
function summarizeOwned(
  owned?: z.infer<typeof SuggestOutfitsRequestSchema>["ownedItems"]
) {
  if (!owned?.length) return "none";
  return owned
    .map(
      (it) =>
        `${it.type}:${it.name}${
          it.color ? `(${it.color})` : ""
        }${it.size ? `[${it.size}]` : ""}`
    )
    .join("; ");
}

function summarizeFilters(
  filters?: z.infer<typeof SuggestOutfitsRequestSchema>["filters"]
) {
  if (!filters) return "none";
  const p: string[] = [];
  if (filters.colors?.length) p.push(`colors=${filters.colors.join("/")}`);
  if (filters.styles?.length) p.push(`styles=${filters.styles.join("/")}`);
  if (filters.sizes?.length) p.push(`sizes=${filters.sizes.join("/")}`);
  if (
    filters.priceRange?.min != null ||
    filters.priceRange?.max != null
  ) {
    p.push(
      `price=${filters.priceRange?.min ?? 0}-${
        filters.priceRange?.max ?? "∞"
      }`
    );
  }
  return p.join(", ");
}

const systemPrompt = `
You are an expert fashion stylist whose ONLY output is valid JSON matching the given schema.
• Return 3–4 cohesive outfit suggestions tailored to the user.
• Re-use user-owned items when they fit.
• Each suggestion needs:
  id, title, rationale (1-2 sentences), 
  4-6 items (type, name, color?, size?, priceHint?, notes?),
  pinterestSearchPhrases (3-5),
  tags, estPriceRange {min, max}.
• Keep item names concise & generic (avoid brands unless user asked).
• Pinterest phrases must read like popular search queries, e.g.
  "white shirt black chinos minimalist".
• NO markdown, no extra text — JSON ONLY.
`.trim();

/** compact example structure to steer the model */
const shape = {
  suggestions: [
    {
      id: "string",
      title: "string",
      rationale: "string",
      items: [
        {
          type: "top|bottom|dress|outerwear|shoes|accessory",
          name: "string",
          color: "string?",
          size: "string?",
          priceHint: "string?",
          notes: "string?",
        },
      ],
      pinterestSearchPhrases: ["string", "string", "string"],
      tags: ["string"],
      estPriceRange: { min: 0, max: 0 },
    },
  ],
};

/* ---------- route ---------- */
suggestRouter.post("/", async (req, res) => {
  const parsed = SuggestOutfitsRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.flatten() });
  }
  const data = parsed.data;

  const userPrompt = `
Description: ${data.description}
Owned items: ${summarizeOwned(data.ownedItems)}
Constraints: ${summarizeFilters(data.filters)}
Number of suggestions: ${Math.min(data.count ?? 3, MAX_SUGGESTIONS)}

Output STRICTLY this JSON:
${JSON.stringify(shape)}
`.trim();

  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? "";
    let json: unknown;

    try {
      json = JSON.parse(raw);
    } catch {
      // fallback: attempt to extract first/last brace segment
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      if (s >= 0 && e > s) json = JSON.parse(raw.slice(s, e + 1));
      else throw new Error("Non-JSON response");
    }

    const validated = SuggestOutfitsResponseSchema.parse(json);
    return res.json(validated);
  } catch (err: any) {
    console.error("suggest-outfits error", err.message || err);
    return res.status(502).json({
      error: "Failed to generate outfit suggestions, please retry.",
    });
  }
});
