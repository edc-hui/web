import type { DipChatKitMessageTurn, DipChatKitPreviewPayload } from '../../../types'

export interface ConversationTurnProps {
  turn: DipChatKitMessageTurn
  onEditQuestion: (turnId: string, question: string) => void
  onCopyQuestion: (question: string) => void
  onCopyAnswer: (answer: string) => void
  onRegenerateAnswer: (turnId: string) => void
  onOpenPreview: (turnId: string, payload: DipChatKitPreviewPayload) => void
}

