import { SensorReading } from './sensor.types'
import { Alert } from './alert.types'
import { FishCount, FishHealthReport } from './fish.types'

// Server -> Client events
export interface ServerToClientEvents {
  'sensor:update': (reading: SensorReading) => void
  'alert:new': (alert: Alert) => void
  'fish:count': (count: FishCount) => void
  'actuator:state': (data: { type: string; state: boolean }) => void
  'health:report': (report: FishHealthReport) => void
}

// Client -> Server commands
export interface ClientToServerEvents {
  'command:feed': (duration: number) => void
  'command:pump': (data: { state: boolean }) => void
  'command:led': (data: { state: boolean }) => void
}
