import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FishController } from './fish.controller';
import { FishService } from './fish.service';
import { FishCount } from '../database/entities/fish-count.entity';
import { HealthReport } from '../database/entities/health-report.entity';
import { FishGrowth } from '../database/entities/fish-growth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FishCount, HealthReport, FishGrowth])
  ],
  controllers: [FishController],
  providers: [FishService],
  exports: [FishService],
})
export class FishModule {}
