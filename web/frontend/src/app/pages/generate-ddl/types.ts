export const generationStatuses = {
  PLANNING_START: "Starting to plan the response",
  PLANning_DONE: "Planning complete",
  TAGS: "System processing/Configuration check",
  PLANNING_FAILED: "Planning failed",
  DOCS_RETRIEVED: "Information found",
  ERROR: "An error occurred",
  ATTEMPT_START: "Starting response generation",
  PART: "Generating response",
  ATTEMPT_COMPILE_OK: "Response successfully compiled",
  FINAL_SUCCESS: "Response ready",
  ATTEMPT_COMPILE_ERROR: "Error during compilation",
  FINAL_FAILURE: "Generation failed",
  CANCELLED: "Canceled"
} as const;