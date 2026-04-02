import { AlertTriangle, FolderTree, Sparkles, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { BookmarkAction, PlanResponse } from '@/agents/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExtensionRequest, ExtensionResponse } from '@/lib/messages'

function sendMessage(request: ExtensionRequest): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(request)
}

type SnapshotInfo = {
  bookmarks: number
  folders: number
  duplicates: number
}

function actionIcon(type: BookmarkAction['type']) {
  if (type === 'delete') {
    return <Trash2 className="h-4 w-4 text-destructive" />
  }
  if (type === 'createFolder') {
    return <FolderTree className="h-4 w-4 text-primary" />
  }
  return <Sparkles className="h-4 w-4 text-primary" />
}

function App() {
  const [goal, setGoal] = useState(
    'Organize by professional categories, keep existing folders when possible, remove duplicates.',
  )
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<SnapshotInfo | null>(null)
  const [plan, setPlan] = useState<PlanResponse | null>(null)

  const previewActions = useMemo(() => plan?.actions.slice(0, 16) ?? [], [plan])

  const runScan = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await sendMessage({ type: 'GENERATE_PLAN', goal })
      if (!response.ok) {
        throw new Error(response.error)
      }

      if (!('plan' in response)) {
        throw new Error('Planner did not return a plan.')
      }

      setSnapshot({
        bookmarks: response.snapshot.flatBookmarks.length,
        folders: response.snapshot.folders.length,
        duplicates: response.snapshot.duplicateGroups.length,
      })
      setPlan(response.plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown extension error')
    } finally {
      setLoading(false)
    }
  }

  const applyPlan = async (): Promise<void> => {
    if (!plan) {
      return
    }
    setApplying(true)
    setError(null)
    try {
      const response = await sendMessage({ type: 'APPLY_PLAN', actions: plan.actions })
      if (!response.ok) {
        throw new Error(response.error)
      }
      if (!('applied' in response)) {
        throw new Error('Apply response is malformed.')
      }

      const failureSuffix =
        response.failedCount > 0 ? ` (${response.failedCount} action(s) failed)` : ''
      setError(`Applied ${response.applied} action(s)${failureSuffix}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown apply error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <main className="mx-auto h-[620px] w-[430px] bg-background p-4 text-foreground">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bookmarkr AI</CardTitle>
            <Badge variant="secondary">MVP</Badge>
          </div>
          <CardDescription>
            Agentic bookmark cleanup for developers, founders, students, and creatives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="text-xs font-medium">Organization goal</label>
          <textarea
            className="h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />

          <div className="flex gap-2">
            <Button className="flex-1" onClick={runScan} disabled={loading}>
              {loading ? 'Analyzing...' : 'Scan and plan'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={applyPlan}
              disabled={!plan || applying || loading}
            >
              {applying ? 'Applying...' : 'Apply changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="mt-3 grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xl font-semibold">{snapshot?.bookmarks ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Bookmarks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xl font-semibold">{snapshot?.folders ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Folders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xl font-semibold">{snapshot?.duplicates ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Duplicates</p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-3">
        <CardHeader>
          <CardTitle>Action preview</CardTitle>
          <CardDescription>
            Review changes before anything touches your bookmarks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {previewActions.length === 0 && (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Run Scan and plan to generate recommendations.
            </div>
          )}
          {previewActions.map((action, index) => (
            <div
              key={`${action.type}-${action.bookmarkId ?? action.folderName ?? index}`}
              className="flex items-start gap-2 rounded-md border border-border p-2"
            >
              <div className="mt-0.5">{actionIcon(action.type)}</div>
              <div className="min-w-0 text-xs">
                <p className="font-medium">
                  {action.type === 'createFolder'
                    ? `Create folder ${action.folderName}`
                    : action.type === 'move'
                      ? `Move bookmark ${action.bookmarkId}`
                      : `Delete bookmark ${action.bookmarkId}`}
                </p>
                <p className="text-muted-foreground">{action.reason}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {(plan?.warnings.length || error) && (
        <Card className="mt-3 border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/40">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              <div className="space-y-1">
                {error && <p>{error}</p>}
                {plan?.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

export default App
