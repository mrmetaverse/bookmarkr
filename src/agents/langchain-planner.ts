import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { planResponseSchema } from './schemas'
import type { BookmarkSnapshot } from './bookmark-analyzer'
import type { PlanResponse } from './schemas'

type PlannerContext = {
  goal: string
  maxActions: number
  snapshot: BookmarkSnapshot
}

function createPrompt(context: PlannerContext): string {
  const folders = context.snapshot.folders
    .map((folder) => `${folder.id}: ${folder.title}`)
    .slice(0, 80)
    .join('\n')

  const bookmarks = context.snapshot.flatBookmarks
    .map((bookmark) => `${bookmark.id}|${bookmark.title}|${bookmark.url}|${bookmark.parentTitle}`)
    .slice(0, 150)
    .join('\n')

  return [
    `Goal: ${context.goal}`,
    `Max actions: ${context.maxActions}`,
    '',
    'Existing folders:',
    folders,
    '',
    'Bookmarks:',
    bookmarks,
    '',
    'Respond with valid JSON in this shape:',
    '{"summary":"string","confidence":0.0,"actions":[{"type":"move|createFolder|delete","bookmarkId":"optional","targetParentId":"optional","targetIndex":0,"folderName":"optional","reason":"string"}],"warnings":["string"]}',
    '',
    'Rules:',
    '- Reuse existing folders whenever reasonable.',
    '- Propose delete only for obvious duplicates or dead links.',
    '- Keep actions minimal and explain each reason clearly.',
  ].join('\n')
}

export async function buildPlanWithLangChain(
  context: PlannerContext,
): Promise<PlanResponse | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    return null
  }

  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    apiKey,
  })

  const response = await model.invoke([
    new SystemMessage(
      'You are a bookmark organization specialist. Return only JSON with no markdown.',
    ),
    new HumanMessage(createPrompt(context)),
  ])

  const content =
    typeof response.content === 'string'
      ? response.content
      : response.content.map((part) => ('text' in part ? part.text : '')).join('')

  try {
    const parsed = JSON.parse(content)
    return planResponseSchema.parse(parsed)
  } catch {
    return null
  }
}
