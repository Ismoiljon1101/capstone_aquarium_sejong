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
import { User } from '../auth/user.entity';
import { AttitudeDetectionEntity } from './entities/attitude-detection.entity';
import { MovementDetectionEntity } from './entities/movement-detection.entity';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

const ALL_ENTITIES = [
  SensorReadingEntity, AlertEntity, CameraSnapshotEntity,
  FishCount, HealthReport, UserCommandEntity, VoiceSessionEntity,
  FeedScheduleEntity, LightScheduleEntity, TankConfigEntity,
  ActuatorEventEntity, FishGrowth, ChatMessageEntity, User,
  AttitudeDetectionEntity, MovementDetectionEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const isPlaceholder = dbUrl?.includes('user:pass@host');

        if (!dbUrl || isPlaceholder) {
          return {
            type: 'better-sqlite3',
            database: 'fishlinic.sqlite',
            entities: ALL_ENTITIES,
            synchronize: true,
            logging: false,
          };
        }

        const isPostgres = dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres');

        if (isPostgres) {
          return {
            type: 'postgres',
            url: dbUrl,
            entities: ALL_ENTITIES,
            synchronize: false,
            migrationsRun: true,
            migrations: [path.join(__dirname, '/../../migrations/*{.ts,.js}')],
            ssl: { rejectUnauthorized: false },
          };
        }

        return {
          type: 'better-sqlite3',
          database: 'fishlinic.sqlite',
          entities: ALL_ENTITIES,
          synchronize: true,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}