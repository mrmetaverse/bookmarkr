import { buildBookmarkSnapshot } from '@/agents/bookmark-analyzer'
import { generateBookmarkPlan } from '@/agents/planner'
import { applyBookmarkActions } from '@/lib/chrome-bookmarks'
import type { ExtensionRequest, ExtensionResponse } from '@/lib/messages'

chrome.runtime.onInstalled.addListener(() => {
  console.log('Bookmarkr AI installed')
})

chrome.runtime.onMessage.addListener(
  (
    request: ExtensionRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    ;(async () => {
      try {
        if (request.type === 'GET_SNAPSHOT') {
          const snapshot = await buildBookmarkSnapshot()
          sendResponse({ ok: true, snapshot })
          return
        }

        if (request.type === 'GENERATE_PLAN') {
          const { snapshot, plan } = await generateBookmarkPlan(request.goal)
          sendResponse({ ok: true, snapshot, plan })
          return
        }

        if (request.type === 'APPLY_PLAN') {
          const result = await applyBookmarkActions(request.actions)
          sendResponse({
            ok: true,
            applied: result.successCount,
            failedCount: result.failed.length,
            errors: result.failed.map((item) => item.error),
          })
          return
        }

        sendResponse({ ok: false, error: 'Unknown request type' })
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown background error',
        })
      }
    })()

    return true
  },
)
