export interface TimebaseInstanceDef {
  id: string;
  url: string;
  readonly: boolean;
  connected: boolean;
  errorMessage?: string;
}
