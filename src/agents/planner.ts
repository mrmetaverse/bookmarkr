import { buildBookmarkSnapshot } from './bookmark-analyzer'
import { buildPlanWithLangChain } from './langchain-planner'
import type { FlatBookmark } from './bookmark-analyzer'
import type { BookmarkAction, PlanResponse } from './schemas'

const CATEGORY_RULES: Record<string, string[]> = {
  Development: ['github.com', 'stackoverflow.com', 'docs.', 'npmjs.com', 'rust-lang.org'],
  Design: ['figma.com', 'dribbble.com', 'behance.net'],
  Research: ['arxiv.org', 'scholar.google.com', 'medium.com', 'substack.com'],
  Business: ['stripe.com', 'hubspot.com', 'notion.so', 'notion.site'],
  Video: ['youtube.com', 'vimeo.com'],
}

function getOrCreateFolderId(
  folderName: string,
  folderByTitle: Map<string, string>,
  actions: BookmarkAction[],
): string {
  const existing = folderByTitle.get(folderName.toLowerCase())
  if (existing) {
    return existing
  }

  const syntheticId = `new:${folderName.toLowerCase().replaceAll(' ', '-')}`
  folderByTitle.set(folderName.toLowerCase(), syntheticId)
  actions.push({
    type: 'createFolder',
    folderName,
    targetParentId: '2',
    reason: `Create ${folderName} for uncategorized items.`,
  })
  return syntheticId
}

function recommendCategory(bookmark: FlatBookmark): string | null {
  const haystack = `${bookmark.title} ${bookmark.url}`.toLowerCase()
  for (const [category, markers] of Object.entries(CATEGORY_RULES)) {
    if (markers.some((marker) => haystack.includes(marker))) {
      return category
    }
  }
  return null
}

function buildHeuristicPlan(snapshot: Awaited<ReturnType<typeof buildBookmarkSnapshot>>): PlanResponse {
  const actions: BookmarkAction[] = []
  const warnings: string[] = []

  const folderByTitle = new Map(
    snapshot.folders.map((folder) => [folder.title.toLowerCase(), folder.id]),
  )

  for (const group of snapshot.duplicateGroups) {
    const [keep, ...drop] = group
    for (const duplicate of drop) {
      actions.push({
        type: 'delete',
        bookmarkId: duplicate.id,
        reason: `Duplicate of ${keep.title}.`,
      })
    }
  }

  for (const bookmark of snapshot.flatBookmarks) {
    const category = recommendCategory(bookmark)
    if (!category) {
      continue
    }

    if (bookmark.parentTitle.toLowerCase() === category.toLowerCase()) {
      continue
    }

    const targetParentId = getOrCreateFolderId(category, folderByTitle, actions)
    actions.push({
      type: 'move',
      bookmarkId: bookmark.id,
      targetParentId,
      reason: `Align ${bookmark.title} with ${category} resources.`,
    })
  }

  if (actions.length === 0) {
    warnings.push('No major improvements were detected in this pass.')
  }

  return {
    summary: `Heuristic planner proposed ${actions.length} action(s).`,
    confidence: actions.length > 0 ? 0.62 : 0.9,
    actions: actions.slice(0, 120),
    warnings,
  }
}

export async function generateBookmarkPlan(goal: string): Promise<{
  snapshot: Awaited<ReturnType<typeof buildBookmarkSnapshot>>
  plan: PlanResponse
}> {
  const snapshot = await buildBookmarkSnapshot()
  const heuristicPlan = buildHeuristicPlan(snapshot)

  const langChainPlan = await buildPlanWithLangChain({
    goal,
    maxActions: 120,
    snapshot,
  })

  return {
    snapshot,
    plan: langChainPlan ?? heuristicPlan,
  }
}
