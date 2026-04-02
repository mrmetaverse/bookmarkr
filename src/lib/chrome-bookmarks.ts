import type { BookmarkAction } from '@/agents/schemas'

type ApplyResult = {
  successCount: number
  failed: Array<{ action: BookmarkAction; error: string }>
}

export async function applyBookmarkActions(actions: BookmarkAction[]): Promise<ApplyResult> {
  const failed: Array<{ action: BookmarkAction; error: string }> = []
  const folderMap = new Map<string, string>()
  let successCount = 0

  for (const action of actions) {
    try {
      if (action.type === 'createFolder') {
        if (!action.folderName || !action.targetParentId) {
          throw new Error('Missing folderName or targetParentId')
        }
        const created = await chrome.bookmarks.create({
          parentId: action.targetParentId,
          title: action.folderName,
        })
        folderMap.set(`new:${action.folderName.toLowerCase().replaceAll(' ', '-')}`, created.id)
        successCount += 1
        continue
      }

      if (action.type === 'move') {
        if (!action.bookmarkId || !action.targetParentId) {
          throw new Error('Missing bookmarkId or targetParentId')
        }
        const targetParentId = folderMap.get(action.targetParentId) ?? action.targetParentId
        await chrome.bookmarks.move(action.bookmarkId, {
          parentId: targetParentId,
          index: action.targetIndex,
        })
        successCount += 1
        continue
      }

      if (action.type === 'delete') {
        if (!action.bookmarkId) {
          throw new Error('Missing bookmarkId')
        }
        await chrome.bookmarks.remove(action.bookmarkId)
        successCount += 1
      }
    } catch (error) {
      failed.push({
        action,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return { successCount, failed }
}
