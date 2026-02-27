import { z } from 'zod';

export const ClipboardEntrySchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  contentHash: z.string(),
  timestamp: z.number(),
  source: z.enum(['editor', 'terminal', 'debug', 'output']),
  filePath: z.string().optional(),
  workspaceName: z.string().optional(),
  language: z.string().default('plaintext'),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  encrypted: z.boolean().default(false),
  expiresAt: z.number().optional().nullable(),
});

export type ClipboardEntry = z.infer<typeof ClipboardEntrySchema>;

export type ClipboardSource = ClipboardEntry['source'];

export interface SearchFilters {
  source?: ClipboardSource[];
  language?: string[];
  pinned?: boolean;
  tags?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
}

export type PasteMode = 'plain' | 'structured';
