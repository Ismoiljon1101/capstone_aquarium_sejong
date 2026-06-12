import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { firstValueFrom, timeout } from 'rxjs';
import { SensorsService } from '../sensors/sensors.service';
import { FishService } from '../fish/fish.service';
import { GatewayGateway } from '../gateway/gateway.gateway';
import { CameraSnapshotEntity } from '../database/entities/camera-snapshot.entity';

const AI_TIMEOUT_MS = 15000;

type CameraCaptureResponse = {
  imagePath: string;
  videoPath?: string;
  capturedAt?: string;
  frameCount?: number;
};

type CameraDevice = { index: number; name: string; uid: string };
type SelectedCamera = CameraDevice;

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private aiUrl: string;
  private bridgeUrl: string;

  /**
   * Single source of truth for which physical camera every capture uses
   * (live stream + all snapshots/scans). The `uid` is the stable identifier we
   * persist/resolve against; the `index` is only the volatile AVFoundation index
   * handed to OpenCV and must never be treated as durable. `null` means let the
   * bridge auto-resolve the iPhone (the default camera).
   */
  private selectedCamera: { index: number; name: string; uid: string } | null =
    null;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private sensors: SensorsService,
    private fish: FishService,
    private gateway: GatewayGateway,
    @InjectRepository(CameraSnapshotEntity)
    private snapshotRepo: Repository<CameraSnapshotEntity>,
  ) {
    this.aiUrl = this.config.get('AI_PREDICTOR_URL') ?? 'http://localhost:8000';
    this.bridgeUrl =
      this.config.get('SERIAL_BRIDGE_URL') ?? 'http://localhost:3001';
  }

  /** Enumerates the host's AVFoundation cameras (index + name + stable uid). */
  private async listDevices(): Promise<CameraDevice[]> {
    const { data } = await firstValueFrom(
      this.http
        .get<{ devices?: CameraDevice[] }>(`${this.bridgeUrl}/camera/devices`)
        .pipe(timeout(8000)),
    );
    return data?.devices ?? [];
  }

  /** Lists the host's AVFoundation cameras and the currently selected source. */
  async getCameras(): Promise<{
    devices: CameraDevice[];
    selected: SelectedCamera | null;
  }> {
    try {
      return { devices: await this.listDevices(), selected: this.selectedCamera };
    } catch (err) {
      this.logger.warn(`getCameras failed: ${err.message}`);
      return { devices: [], selected: this.selectedCamera };
    }
  }

  /**
   * Selects the camera every capture uses, by its stable uid. Re-enumerates and
   * resolves the uid to the current AVFoundation index. An empty uid resets to
   * the auto-resolved default. Returns `ok: false` (and falls back to default)
   * when the uid no longer matches any connected device.
   */
  async selectCamera(
    uid?: string,
  ): Promise<{ ok: boolean; selected: SelectedCamera | null; reason?: string }> {
    if (!uid) {
      this.selectedCamera = null;
      this.logger.log('Camera source reset to auto-resolve (default)');
      return { ok: true, selected: null };
    }
    let devices: CameraDevice[] = [];
    try {
      devices = await this.listDevices();
    } catch (err) {
      this.logger.warn(`selectCamera enumeration failed: ${err.message}`);
    }
    const match = devices.find((d) => d.uid === uid);
    if (!match) {
      this.selectedCamera = null;
      this.logger.warn(
        `Camera uid "${uid}" not found — falling back to default camera`,
      );
      return { ok: false, selected: null, reason: 'Camera no longer available' };
    }
    this.selectedCamera = { index: match.index, name: match.name, uid: match.uid };
    this.logger.log(
      `Camera source set to "${match.name}" (uid ${match.uid} -> AVFoundation index ${match.index})`,
    );
    return { ok: true, selected: this.selectedCamera };
  }

  /**
   * Re-enumerates devices and re-resolves the saved camera's uid to a fresh
   * index (indices drift across reconnects/reboots). Falls back to the default
   * and clears the stale selection if the saved camera is gone.
   */
  async refreshCameras(): Promise<{
    devices: CameraDevice[];
    selected: SelectedCamera | null;
    fellBack: boolean;
  }> {
    let devices: CameraDevice[] = [];
    try {
      devices = await this.listDevices();
    } catch (err) {
      this.logger.warn(`refreshCameras enumeration failed: ${err.message}`);
      return { devices: [], selected: this.selectedCamera, fellBack: false };
    }
    if (!this.selectedCamera) {
      return { devices, selected: null, fellBack: false };
    }
    const match = devices.find((d) => d.uid === this.selectedCamera!.uid);
    if (!match) {
      const lost = this.selectedCamera.name;
      this.selectedCamera = null;
      this.logger.warn(
        `Saved camera "${lost}" no longer present — fell back to default`,
      );
      return { devices, selected: null, fellBack: true };
    }
    if (match.index !== this.selectedCamera.index) {
      this.logger.log(
        `Camera "${match.name}" index changed ${this.selectedCamera.index} -> ${match.index}; re-resolved via uid`,
      );
    }
    this.selectedCamera = { index: match.index, name: match.name, uid: match.uid };
    return { devices, selected: this.selectedCamera, fellBack: false };
  }

  async requestSnapshot(
    triggeredBy: string = 'MANUAL',
  ): Promise<{ snapshot: CameraSnapshotEntity; videoPath?: string }> {
    const cam = this.selectedCamera;
    this.logger.log(
      `Requesting snapshot triggered by: ${triggeredBy} from camera ` +
        (cam
          ? `"${cam.name}" (uid ${cam.uid}, AVFoundation index ${cam.index})`
          : 'auto-resolved (default)'),
    );
    const { data } = await firstValueFrom(
      this.http
        .post<CameraCaptureResponse>(`${this.bridgeUrl}/camera/snapshot`, {
          triggeredBy,
          device: cam?.index,
        })
        .pipe(timeout(AI_TIMEOUT_MS)),
    );
    const snapshot = this.snapshotRepo.create({
      imagePath: data.imagePath,
      triggeredBy,
    });
    return {
      snapshot: await this.snapshotRepo.save(snapshot),
      videoPath: data.videoPath,
    };
  }

  async detectDisease(imagePath: string) {
    const { data } = await firstValueFrom(
      this.http
        .post(`${this.aiUrl}/predict/disease`, { imagePath })
        .pipe(timeout(AI_TIMEOUT_MS)),
    );
    return data;
  }

  async countFish(imagePath: string) {
    const { data } = await firstValueFrom(
      this.http
        .post(`${this.aiUrl}/predict/count`, { imagePath })
        .pipe(timeout(AI_TIMEOUT_MS)),
    );
    return data;
  }

  async detectBehavior(videoPath?: string, imagePath?: string) {
    if (!videoPath) {
      return { status: 'unavailable', reason: 'video capture unavailable' };
    }

    try {
      const { data } = await firstValueFrom(
        this.http
          .post(`${this.aiUrl}/predict/behavior`, { videoPath, imagePath })
          .pipe(timeout(AI_TIMEOUT_MS)),
      );
      return data;
    } catch (err) {
      this.logger.warn(`detectBehavior failed: ${err.message}`);
      return { status: 'unavailable', reason: err.message };
    }
  }

  async getWaterQualityScore(readings: Record<string, number>) {
    const { data } = await firstValueFrom(
      this.http
        .post(`${this.aiUrl}/predict/quality`, readings)
        .pipe(timeout(AI_TIMEOUT_MS)),
    );
    return data;
  }

  async runFullAnalysis(triggeredBy: string = 'MANUAL') {
    this.logger.log('Starting full vision analysis pipeline...');

    try {
      const { snapshot, videoPath } = await this.requestSnapshot(triggeredBy);
      const latestSensors = await this.sensors.getLatest();

      if (!latestSensors || latestSensors.length === 0) {
        this.logger.warn(
          'No sensor readings available, water quality score will be skipped',
        );
      }

      const sensorMap = (latestSensors ?? []).reduce<Record<string, number>>(
        (acc, s) => ({ ...acc, [s.type]: s.value }),
        {},
      );

      const hasSensorData = Object.keys(sensorMap).length > 0;

      const [disease, count, behavior, quality] = await Promise.all([
        this.detectDisease(snapshot.imagePath).catch((err) => {
          this.logger.error(`detectDisease failed: ${err.message}`);
          return { disease: 'unknown', confidence: 0 };
        }),
        this.countFish(snapshot.imagePath).catch((err) => {
          this.logger.error(`countFish failed: ${err.message}`);
          return { count: 0, confidence: 0 };
        }),
        this.detectBehavior(videoPath, snapshot.imagePath).catch((err) => {
          this.logger.error(`detectBehavior failed: ${err.message}`);
          return { status: 'unknown' };
        }),
        hasSensorData
          ? this.getWaterQualityScore(sensorMap).catch((err) => {
              this.logger.error(`getWaterQualityScore failed: ${err.message}`);
              return { score: 0, label: 'unknown' };
            })
          : Promise.resolve({ score: 0, label: 'no_sensor_data' }),
      ]);

      const savedCount = await this.fish.saveCount(
        count.count,
        count.confidence,
        snapshot.snapshotId,
      );
      const sensorStatus = this.buildSensorStatus(latestSensors ?? []);
      const diseaseLabel = disease.disease ?? 'unknown';
      const behaviorLabel = behavior.label ?? behavior.status ?? 'unknown';
      const behaviorStatus = this.mapBehaviorStatus(
        String(behavior.status ?? 'warn'),
      );
      const visualStatus = this.mapDiseaseStatus(
        diseaseLabel,
        Number(disease.confidence ?? 0),
      );
      const overallScore = this.computeOverallScore([
        sensorStatus.phStatus,
        sensorStatus.tempStatus,
        sensorStatus.doStatus,
        visualStatus,
        behaviorStatus,
      ]);
      const confidencePct = Math.round((disease.confidence ?? 0) * 100);

      const report = await this.fish.saveHealthReport({
        snapshotId: snapshot.snapshotId,
        phStatus: sensorStatus.phStatus,
        tempStatus: sensorStatus.tempStatus,
        doStatus: sensorStatus.doStatus,
        visualStatus,
        behaviorStatus,
        behaviorLabel,
        behaviorConfidence: Number(behavior.confidence ?? 0),
        overallScore,
        summary: `AI report: disease ${diseaseLabel} (${confidencePct}% confidence). Behavior ${behaviorLabel}. Water quality ${quality.label ?? quality.status ?? 'unknown'}.`,
        diseaseClass: diseaseLabel,
        mlConfidence: Number(disease.confidence ?? 0),
        severity:
          visualStatus === 'critical'
            ? 'High'
            : visualStatus === 'warn'
              ? 'Medium'
              : 'Low',
      });

      this.gateway.emitFishCount({
        count: savedCount.count,
        timestamp: savedCount.timestamp.toISOString(),
        snapshotId: savedCount.snapshotId,
      });

      this.gateway.emitHealthReport({
        reportId: report.reportId,
        phStatus: report.phStatus as 'ok' | 'warn' | 'critical',
        tempStatus: report.tempStatus as 'ok' | 'warn' | 'critical',
        doStatus: report.doStatus as 'ok' | 'warn' | 'critical',
        visualStatus: report.visualStatus as 'ok' | 'warn' | 'critical',
        behaviorStatus: report.behaviorStatus as 'ok' | 'warn' | 'critical',
        createdAt: report.timestamp.toISOString(),
      });

      return {
        snapshotId: snapshot.snapshotId,
        videoPath,
        disease,
        count,
        behavior,
        quality,
        hasSensorData,
        reportId: report.reportId,
      };
    } catch (error) {
      this.logger.error(
        `Vision analysis pipeline failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLatestReport() {
    return await this.fish.getLatestReport();
  }

  async getSnapshot(snapshotId: number) {
    return await this.snapshotRepo.findOne({ where: { snapshotId } });
  }

  /** Returns the latest fish count and health report without triggering a new capture. */
  async getLatestSummary(): Promise<{
    fishCount: number;
    disease: string;
    confidence: number;
    imagePath: string | null;
    timestamp: string;
  }> {
    const report = await this.getLatestReport();
    const latestCount = await this.fish.getLatestCount();
    const latestSnapshot = (
      await this.snapshotRepo.find({
        order: { snapshotId: 'DESC' },
        take: 1,
      })
    )[0];

    let diseaseName = report?.visualStatus ?? 'unknown';
    if (diseaseName === 'HF Healthy Fish') {
      diseaseName = 'healthy';
    } else if (diseaseName === 'BD Bacterial Disease') {
      diseaseName = 'Bacterial Disease';
    } else if (diseaseName === 'FD Fungal Disease') {
      diseaseName = 'Fungal Disease';
    } else if (diseaseName === 'PD Parasitic Disease') {
      diseaseName = 'Parasitic Disease';
    }

    return {
      fishCount: latestCount?.count ?? 0,
      disease: diseaseName,
      confidence: latestCount?.confidence ?? 0.97,
      imagePath: latestSnapshot
        ? `/vision/snapshots/${latestSnapshot.snapshotId}/image`
        : null,
      timestamp: latestSnapshot
        ? latestSnapshot.timestamp.toISOString()
        : new Date(0).toISOString(),
    };
  }

  /** Checks whether the serial-bridge has a live camera (iPhone via Continuity Camera) available. */
  async getStreamStatus(): Promise<{ available: boolean; device?: string }> {
    try {
      const { data } = await firstValueFrom(
        this.http
          .get<{ devices?: { index: number; name: string }[] }>(
            `${this.bridgeUrl}/camera/devices`,
          )
          .pipe(timeout(5000)),
      );
      const devices = data?.devices ?? [];
      const iphone = devices.find(
        (d) => /iphone/i.test(d.name) && !/desk view/i.test(d.name),
      );
      return { available: !!iphone, device: iphone?.name };
    } catch (err) {
      this.logger.warn(`getStreamStatus failed: ${err.message}`);
      return { available: false };
    }
  }

  /** Proxies the serial-bridge MJPEG camera stream to the client. */
  async proxyStream(res: Response): Promise<void> {
    try {
      const device = this.selectedCamera?.index;
      const streamUrl =
        device !== undefined
          ? `${this.bridgeUrl}/camera/stream?device=${device}`
          : `${this.bridgeUrl}/camera/stream`;
      const response = await firstValueFrom(
        this.http.get(streamUrl, {
          responseType: 'stream',
        }),
      );
      res.writeHead(response.status, {
        'Content-Type':
          response.headers['content-type'] ??
          'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      response.data.pipe(res);
      res.req.on('close', () => {
        response.data.destroy();
      });
    } catch (err) {
      this.logger.warn(`proxyStream failed: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Live stream unavailable' });
      } else {
        res.end();
      }
    }
  }

  private buildSensorStatus(
    readings: Array<{ type: string; status?: string }>,
  ) {
    const statusByType = new Map<string, 'ok' | 'warn' | 'critical'>();
    for (const reading of readings) {
      statusByType.set(
        reading.type,
        (reading.status ?? 'ok') as 'ok' | 'warn' | 'critical',
      );
    }
    return {
      phStatus: statusByType.get('pH') ?? 'ok',
      tempStatus: statusByType.get('temp_c') ?? 'ok',
      doStatus: statusByType.get('do_mg_l') ?? 'ok',
    };
  }

  private mapDiseaseStatus(
    label: string,
    confidence: number,
  ): 'ok' | 'warn' | 'critical' {
    const normalized = label.toLowerCase();
    if (normalized === 'none' || normalized === 'healthy') return 'ok';
    if (normalized === 'unknown') return 'warn';
    return confidence >= 0.8 ? 'critical' : 'warn';
  }

  private mapBehaviorStatus(status: string): 'ok' | 'warn' | 'critical' {
    if (status === 'ok') return 'ok';
    if (status === 'critical') return 'critical';
    return 'warn';
  }

  private computeOverallScore(
    statuses: Array<'ok' | 'warn' | 'critical'>,
  ): number {
    let score = 1;
    for (const status of statuses) {
      if (status === 'warn') score -= 0.1;
      if (status === 'critical') score -= 0.25;
    }
    return Math.max(0, Number(score.toFixed(2)));
  }
}
