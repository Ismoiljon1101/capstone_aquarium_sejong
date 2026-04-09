export interface FishCount {
  count: number
  timestamp: string
  snapshotId: number
}

export interface FishGrowth {
  date: string
  avgSizeEstimate: number
  count: number
}

export interface FishHealthReport {
  reportId: number
  phStatus: 'ok' | 'warn' | 'critical'
  tempStatus: 'ok' | 'warn' | 'critical'
  doStatus: 'ok' | 'warn' | 'critical'
  visualStatus: 'ok' | 'warn' | 'critical'
  behaviorStatus: 'ok' | 'warn' | 'critical'
  createdAt: string
}
