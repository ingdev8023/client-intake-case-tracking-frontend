export const CASE_STAGES = [
  "intake",
  "document_collection",
  "review",
  "edits",
  "pending_submission",
  "submitted",
  "closed",
];

export const CASE_STATUS_OPTIONS = ["open", "pending", "closed"];

export const ALLOWED_STAGE_TRANSITIONS = {
  intake: ["document_collection"],
  document_collection: ["review"],
  review: ["edits"],
  edits: ["pending_submission", "review"],
  pending_submission: ["submitted"],
  submitted: ["closed"],
  closed: [],
};

export function getAllowedNextStages(currentStage) {
  return ALLOWED_STAGE_TRANSITIONS[currentStage] || [];
}
