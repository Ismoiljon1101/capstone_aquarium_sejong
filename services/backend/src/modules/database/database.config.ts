import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AlertEntity } from './entities/alert.entity';
import { CameraSnapshotEntity } from './entities/camera-snapshot.entity';
import { FishCount } from './entities/fish-count.entity';
import { FishGrowth } from './entities/fish-growth.entity';
import { HealthReport } from './entities/health-report.entity';
import { SensorReadingEntity } from './entities/sensor-reading.entity';
import { UserCommandEntity } from './entities/user-command.entity';
import { VoiceSessionEntity } from './entities/voice-session.entity';

export const databaseEntities = [
  SensorReadingEntity,
  AlertEntity,
  CameraSnapshotEntity,
  FishCount,
  FishGrowth,
  HealthReport,
  UserCommandEntity,
  VoiceSessionEntity,
];

export function buildDatabaseOptions(
  dbUrl?: string,
): TypeOrmModuleOptions {
  const isPlaceholder = dbUrl?.includes('user:pass@host');

  if (!dbUrl || isPlaceholder) {
    return {
      type: 'better-sqlite3',
      database: ':memory:',
      entities: databaseEntities,
      synchronize: true,
      logging: false,
    };
  }

  const isPostgres = dbUrl.startsWith('postgresql');

  return {
    type: isPostgres ? 'postgres' : 'sqlite',
    url: isPostgres ? dbUrl : undefined,
    database: isPostgres ? undefined : 'fishlinic.sqlite',
    entities: databaseEntities,
    synchronize: true,
  };
}
