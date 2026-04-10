import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  SensorReading,
  Alert,
  FishCount,
  FishHealthReport,
} from '@fishlinic/types';
import { ActuatorsService } from '../actuators/actuators.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')
      : ['http://localhost:3002', 'http://localhost:3000'],
    credentials: true,
  },
})
export class GatewayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GatewayGateway.name);

  constructor(private readonly actuators: ActuatorsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // --- Emitters (Server -> Client) ---

  emitSensorUpdate(reading: SensorReading) {
    this.server.emit('sensor:update', reading);
  }

  emitAlertNew(alert: Alert) {
    this.server.emit('alert:new', alert);
  }

  emitFishCount(count: FishCount) {
    this.server.emit('fish:count', count);
  }

  emitHealthReport(report: FishHealthReport) {
    this.server.emit('health:report', report);
  }

  emitActuatorState(data: { type: string; state: boolean }) {
    this.server.emit('actuator:state', data);
  }

  // --- Listeners (Client -> Server) ---

  @SubscribeMessage('command:feed')
  async handleFeed(@MessageBody() data: { state: boolean }) {
    this.logger.log(`Manual feed requested: ${data.state}`);
    await this.actuators.triggerActuator({
      actuatorId: 1,
      type: 'FEEDER',
      relayChannel: 1,
      state: data.state,
      source: 'APP',
    });
    this.emitActuatorState({ type: 'FEEDER', state: data.state });
  }

  @SubscribeMessage('command:pump')
  async handlePump(@MessageBody() data: { state: boolean }) {
    this.logger.log(`Manual pump control: ${data.state}`);
    await this.actuators.triggerActuator({
      actuatorId: 2,
      type: 'AIR_PUMP',
      relayChannel: 2,
      state: data.state,
      source: 'APP',
    });
    this.emitActuatorState({ type: 'AIR_PUMP', state: data.state });
  }

  @SubscribeMessage('command:led')
  async handleLed(@MessageBody() data: { state: boolean }) {
    this.logger.log(`Manual LED control: ${data.state}`);
    await this.actuators.triggerActuator({
      actuatorId: 3,
      type: 'LED_STRIP',
      relayChannel: 3,
      state: data.state,
      source: 'APP',
    });
    this.emitActuatorState({ type: 'LED_STRIP', state: data.state });
  }
}
