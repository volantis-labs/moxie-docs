import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      // On a translated page: the hash of the English page it was made from.
      // scripts/check-docs.mjs compares it with the current English page.
      extend: z.object({ sourceHash: z.string().optional() }),
    }),
  }),
};
