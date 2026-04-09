// Placeholder for API Request/Response shapes
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SerialStatusResponse {
  connected: boolean
  main: boolean
  secondary: boolean
  mockMode: boolean
}
