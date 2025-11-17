export interface AIGenerationRequest {
  prompt: string;
  agentType: "doc" | "design" | "advisor";
  provider?: "openai" | "claude";
}

export interface AIGenerationResponse {
  content: string;
  provider: string;
  agentType: string;
}

export interface AIProviderStatus {
  available: string[];
  default: string;
}
