import type { BookmarkAction, PlanResponse } from '@/agents/schemas'
import type { BookmarkSnapshot } from '@/agents/bookmark-analyzer'

export type GeneratePlanRequest = {
  type: 'GENERATE_PLAN'
  goal: string
}

export type ApplyPlanRequest = {
  type: 'APPLY_PLAN'
  actions: BookmarkAction[]
}

export type GetSnapshotRequest = {
  type: 'GET_SNAPSHOT'
}

export type ExtensionRequest = GeneratePlanRequest | ApplyPlanRequest | GetSnapshotRequest

export type ExtensionResponse =
  | { ok: true; snapshot: BookmarkSnapshot }
  | { ok: true; snapshot: BookmarkSnapshot; plan: PlanResponse }
  | { ok: true; applied: number; failedCount: number; errors: string[] }
  | { ok: false; error: string }
