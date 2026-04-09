export type SensorType = 'pH' | 'temp_c' | 'do_mg_l' | 'CO2'

export interface SensorReading {
  sensorId: number
  type: SensorType
  value: number
  unit: string
  timestamp: string
  status: 'ok' | 'warn' | 'critical'
}
