import { z } from 'zod'

export const bookmarkNodeSchema = z.object({
  id: z.string(),
  parentId: z.string().optional(),
  title: z.string(),
  url: z.string().optional(),
  dateAdded: z.number().optional(),
  index: z.number().optional(),
  children: z.array(z.any()).optional(),
})

export const bookmarkActionSchema = z.object({
  type: z.enum(['move', 'createFolder', 'delete']),
  bookmarkId: z.string().optional(),
  targetParentId: z.string().optional(),
  targetIndex: z.number().optional(),
  folderName: z.string().optional(),
  reason: z.string(),
})

export const planResponseSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  actions: z.array(bookmarkActionSchema),
  warnings: z.array(z.string()).default([]),
})

export type BookmarkAction = z.infer<typeof bookmarkActionSchema>
export type PlanResponse = z.infer<typeof planResponseSchema>
