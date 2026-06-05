export type ToolName =
  | 'readSensors'
  | 'readHistory'
  | 'readBehaviorAnalysis'
  | 'readDiagnoses'
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

export interface AgentToolCall {
  id?: string;
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: AgentToolCall[];
  tool_call_id?: string;
}

export interface AgentChatResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: AgentToolCall[];
  };
}

export interface PendingAction {
  tool: ToolName;
  args: Record<string, unknown>;
  reason: string;
}

export interface AgentResult {
  response: string;
  aiOffline: boolean;
  pendingAction?: PendingAction;
}
