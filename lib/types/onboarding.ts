import type { CefrLevel } from "./common"
import type { DailyWordCandidate } from "./catalog"

export interface OnboardingWordSelectionPayload {
  items: DailyWordCandidate[]
  estimatedLevel: CefrLevel
  confidenceByLevel: Record<CefrLevel, number>
}
