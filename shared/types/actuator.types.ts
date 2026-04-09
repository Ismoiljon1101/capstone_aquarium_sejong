export type ActuatorType = 'FEEDER' | 'AIR_PUMP' | 'LED_STRIP' | 'STATUS_LED'

export interface ActuatorCommand {
  actuatorId: number
  type: ActuatorType
  relayChannel: number
  state: boolean
  source: 'APP' | 'CRON' | 'AI' | 'EMERGENCY'
}
