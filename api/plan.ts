import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

const requestSchema = z.object({
  goal: z.string().min(1),
  snapshot: z.object({
    flatBookmarks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        parentTitle: z.string(),
      }),
    ),
    folders: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
      }),
    ),
  }),
})

const responseSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  actions: z.array(
    z.object({
      type: z.enum(['move', 'createFolder', 'delete']),
      bookmarkId: z.string().optional(),
      targetParentId: z.string().optional(),
      folderName: z.string().optional(),
      reason: z.string(),
    }),
  ),
  warnings: z.array(z.string()),
})

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parseResult = requestSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid request payload' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is missing' })
    return
  }

  try {
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      apiKey,
    })

    const prompt = JSON.stringify(parseResult.data).slice(0, 12000)
    const llmResult = await model.invoke([
      new SystemMessage(
        'You produce bookmark action plans. Return only strict JSON with keys summary, confidence, actions, warnings.',
      ),
      new HumanMessage(prompt),
    ])

    const content =
      typeof llmResult.content === 'string'
        ? llmResult.content
        : llmResult.content.map((part) => ('text' in part ? part.text : '')).join('')

    const parsedJson = JSON.parse(content)
    const validated = responseSchema.parse(parsedJson)
    res.status(200).json(validated)
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Planner failed',
    })
  }
}
