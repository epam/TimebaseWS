export interface CompileResponse {
  error: string;
  errorLocation: ErrorLocation;
}

export interface ErrorLocation {
  startPosition: number;
  endPosition: number;
  startLine: number;
  endLine: number;
}
