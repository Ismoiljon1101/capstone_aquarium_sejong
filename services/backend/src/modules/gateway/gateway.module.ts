import { Module, Global } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { GatewayController } from './gateway.controller';
import { GatewayGateway } from './gateway.gateway';
import { ActuatorsModule } from '../actuators/actuators.module';

@Global()
@Module({
  imports: [ActuatorsModule],
  controllers: [GatewayController],
  providers: [GatewayService, GatewayGateway],
  exports: [GatewayGateway],
})
export class GatewayModule {}
