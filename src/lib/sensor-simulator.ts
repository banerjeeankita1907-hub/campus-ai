export interface SensorData {
  id: string;
  type: 'temperature' | 'humidity' | 'occupancy' | 'noise';
  value: number;
  timestamp: number;
  anomaly: boolean;
  lat: number;
  lng: number;
  building: string;
}

const BUILDINGS = ['Library', 'Gym', 'Cafeteria', 'Dorm A', 'Dorm B'] as const;
const SENSOR_TYPES: SensorData['type'][] = ['temperature', 'humidity', 'occupancy', 'noise'];

// Deterministic sensor geometry keeps identities and map positions stable between runs.
const SENSORS: Omit<SensorData, 'value' | 'timestamp' | 'anomaly'>[] = Array.from(
  { length: 50 },
  (_, i) => ({
    id: `sensor-${i + 1}`,
    type: SENSOR_TYPES[i % SENSOR_TYPES.length],
    lat: 34.1377 + ((i % 10) - 4.5) * 0.0005,
    lng: -118.1253 + (Math.floor(i / 10) - 2) * 0.001,
    building: BUILDINGS[i % BUILDINGS.length],
  })
);

export interface SensorGenerationOptions {
  now?: Date;
  random?: () => number;
}

export function generateSensorReadings(options: SensorGenerationOptions = {}): SensorData[] {
  const now = options.now ?? new Date();
  const random = options.random ?? Math.random;
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError('now must be a valid Date');
  }

  const hour = now.getHours();
  return SENSORS.map((sensor) => {
    let base = 0;
    switch (sensor.type) {
      case 'temperature':
        base = 22 + 5 * Math.sin(((hour - 6) * Math.PI) / 12);
        break;
      case 'humidity':
        base = 48 + 15 * Math.cos(((hour - 8) * Math.PI) / 12);
        break;
      case 'occupancy':
        base = Math.max(0, 35 * Math.sin(((hour - 7) * Math.PI) / 8));
        break;
      case 'noise':
        base = 45 + 20 * Math.sin(((hour - 9) * Math.PI) / 6);
        break;
    }

    const noise = (random() - 0.5) * 2;
    const injected = random() < 0.03;
    const value = injected ? base * (1.6 + random() * 0.5) : base + noise;
    return {
      ...sensor,
      value: Math.round(value * 10) / 10,
      timestamp,
      anomaly: injected,
    };
  });
}

export class AnomalyDetector {
  private readonly history = new Map<string, number[]>();

  constructor(
    private readonly windowSize = 20,
    private readonly threshold = 2.5,
    private readonly minimumHistory = 5,
    private readonly standardDeviationFloor = 0.5,
  ) {
    if (!Number.isInteger(windowSize) || windowSize < 1) {
      throw new RangeError('windowSize must be a positive integer');
    }
    if (!Number.isFinite(threshold) || threshold <= 0) {
      throw new RangeError('threshold must be positive and finite');
    }
    if (!Number.isInteger(minimumHistory) || minimumHistory < 2) {
      throw new RangeError('minimumHistory must be an integer of at least 2');
    }
    if (!Number.isFinite(standardDeviationFloor) || standardDeviationFloor <= 0) {
      throw new RangeError('standardDeviationFloor must be positive and finite');
    }
  }

  detect(sensors: SensorData[]): SensorData[] {
    return sensors.map((sensor) => {
      if (!Number.isFinite(sensor.value)) {
        throw new RangeError(`Sensor ${sensor.id} has a non-finite value`);
      }

      const history = this.history.get(sensor.id) ?? [];
      let statisticallyDetected = false;

      // Compare with prior observations only. Including the candidate sample
      // in its own baseline artificially pulls the z-score toward zero.
      if (history.length >= this.minimumHistory) {
        const mean = history.reduce((sum, value) => sum + value, 0) / history.length;
        const variance = history.reduce(
          (sum, value) => sum + (value - mean) ** 2,
          0,
        ) / history.length;
        const standardDeviation = Math.max(
          Math.sqrt(variance),
          this.standardDeviationFloor,
        );
        const zScore = Math.abs((sensor.value - mean) / standardDeviation);
        statisticallyDetected = zScore > this.threshold;
      }

      history.push(sensor.value);
      if (history.length > this.windowSize) history.shift();
      this.history.set(sensor.id, history);

      // Preserve simulator-injected labels as ground-truth metadata.
      return {
        ...sensor,
        anomaly: sensor.anomaly || statisticallyDetected,
      };
    });
  }

  reset(sensorId?: string): void {
    if (sensorId) {
      this.history.delete(sensorId);
    } else {
      this.history.clear();
    }
  }
}

export function forecastTemperature(values: number[]): number {
  if (values.length === 0) {
    throw new RangeError('At least one temperature value is required');
  }
  if (!values.every(Number.isFinite)) {
    throw new RangeError('Temperature values must all be finite');
  }
  const n = values.length;
  if (n === 1) return Math.round(values[0] * 10) / 10;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    throw new Error('Cannot fit a trend to the supplied observations');
  }
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return Math.round((intercept + slope * n) * 10) / 10;
}
