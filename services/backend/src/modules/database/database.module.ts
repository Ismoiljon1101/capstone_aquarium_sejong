import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { SensorReadingEntity } from './entities/sensor-reading.entity';
import { AlertEntity } from './entities/alert.entity';
import { CameraSnapshotEntity } from './entities/camera-snapshot.entity';
import { FishCount } from './entities/fish-count.entity';
import { HealthReport } from './entities/health-report.entity';
import { UserCommandEntity } from './entities/user-command.entity';
import { VoiceSessionEntity } from './entities/voice-session.entity';
import { FeedScheduleEntity } from './entities/feed-schedule.entity';
import { LightScheduleEntity } from './entities/light-schedule.entity';
import { TankConfigEntity } from './entities/tank-config.entity';
import { ActuatorEventEntity } from './entities/actuator-event.entity';
import { FishGrowth } from './entities/fish-growth.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const isPlaceholder = dbUrl?.includes('user:pass@host');
        
        const entitiesList = [
          SensorReadingEntity, AlertEntity, CameraSnapshotEntity,
          FishCount, HealthReport, UserCommandEntity, VoiceSessionEntity,
          FeedScheduleEntity, LightScheduleEntity, TankConfigEntity, ActuatorEventEntity, FishGrowth, ChatMessageEntity,
        ];

        if (!dbUrl || isPlaceholder) {
          // Dev/demo fallback: persist to local file so data survives restarts
          return {
            type: 'better-sqlite3',
            database: 'fishlinic.sqlite',
            entities: entitiesList,
            synchronize: true,
            logging: false,
          };
        }

        const isPostgres = dbUrl?.startsWith('postgresql');

        return {
          type: isPostgres ? 'postgres' : 'sqlite',
          url: isPostgres ? dbUrl : undefined,
          database: isPostgres ? undefined : 'fishlinic.sqlite',
          entities: entitiesList,
          synchronize: !isPostgres, // Only auto-create tables in SQLite dev mode
          migrationsRun: isPostgres, // Auto run migrations on Postgres startup
          migrations: isPostgres ? [path.join(__dirname, '/../../migrations/*{.ts,.js}')] : [],
        };
      },
    }),
    TypeOrmModule.forFeature([
      SensorReadingEntity, AlertEntity, CameraSnapshotEntity,
      FishCount, HealthReport, UserCommandEntity, VoiceSessionEntity,
      FeedScheduleEntity, LightScheduleEntity, TankConfigEntity, ActuatorEventEntity, FishGrowth, ChatMessageEntity,
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}
