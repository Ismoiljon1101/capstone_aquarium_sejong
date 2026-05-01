export type ToolName =
  | 'readSensors'
  | 'readHistory'
  | 'getActuatorState'
  | 'readThresholds'
  | 'controlPump'
  | 'controlLed'
  | 'triggerFeed';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: ToolName;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// Ollama returns tool calls as objects (not JSON strings like OpenAI)
export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: OllamaToolCall[];
}

export interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
}

// A proposed action that requires user confirmation before executing
export interface PendingAction {
  tool: ToolName;
  args: Record<string, unknown>;
  reason: string; // human-readable explanation from Veronica
}

export interface AgentResult {
  response: string;
  aiOffline: boolean;
  pendingAction?: PendingAction; // present when Veronica proposes a write action
}
