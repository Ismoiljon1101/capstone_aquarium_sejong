export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'

export interface Alert {
  alertId: number
  sensorId: number
  tankId: number
  type: string
  severity: AlertSeverity
  message: string
  acknowledged: boolean
  createdAt: string
}
