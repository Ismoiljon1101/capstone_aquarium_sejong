import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SensorReadingEntity } from './entities/sensor-reading.entity';
import { AlertEntity } from './entities/alert.entity';
import { CameraSnapshotEntity } from './entities/camera-snapshot.entity';
import { FishCount } from './entities/fish-count.entity';
import { HealthReport } from './entities/health-report.entity';
import { UserCommandEntity } from './entities/user-command.entity';
import { VoiceSessionEntity } from './entities/voice-session.entity';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const isPlaceholder = dbUrl?.includes('user:pass@host');
        
        if (!dbUrl || isPlaceholder) {
          return {
            type: 'sqljs',
            location: 'fishlinic.sqlite',
            autoSave: true,
            entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
            synchronize: true,
          };
        }

        const isPostgres = dbUrl?.startsWith('postgresql');

        return {
          type: isPostgres ? 'postgres' : 'sqlite',
          url: isPostgres ? dbUrl : undefined,
          database: isPostgres ? undefined : 'fishlinic.sqlite',
          entities: [
            SensorReadingEntity,
            AlertEntity,
            CameraSnapshotEntity,
            FishCount,
            HealthReport,
            UserCommandEntity,
            VoiceSessionEntity,
          ],
          synchronize: true, // Auto-create tables for dev mode
        };
      },
    }),
    TypeOrmModule.forFeature([
      SensorReadingEntity,
      AlertEntity,
      CameraSnapshotEntity,
      FishCount,
      HealthReport,
      UserCommandEntity,
      VoiceSessionEntity,
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}
