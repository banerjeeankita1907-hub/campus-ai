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

const BUILDINGS = ['Library', 'Gym', 'Cafeteria', 'Dorm A', 'Dorm B'];

const SENSORS: Omit<SensorData, 'value' | 'timestamp' | 'anomaly'>[] = Array.from(
  { length: 50 },
  (_, i) => ({
    id: `sensor-${i}`,
    type: ['temperature', 'humidity', 'occupancy', 'noise'][i % 4] as SensorData['type'],
    lat: 34.1377 + (Math.random() - 0.5) * 0.008,
    lng: -118.1253 + (Math.random() - 0.5) * 0.008,
    building: BUILDINGS[i % 5],
  })
);

export function generateSensorReadings(): SensorData[] {
  const now = Date.now();
  const hour = new Date().getHours();
  return SENSORS.map((s) => {
    let base = 0;
    switch (s.type) {
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
    const noise = (Math.random() - 0.5) * 2;
    const isInjected = Math.random() < 0.03;
    const value = isInjected ? base * (1.6 + Math.random() * 0.5) : base + noise;
    return {
      ...s,
      value: Math.round(value * 10) / 10,
      timestamp: now,
      anomaly: isInjected,
    };
  });
}

export class AnomalyDetector {
  private windowSize = 20;
  private history: Map<string, number[]> = new Map();
  private threshold = 2.5;

  detect(sensors: SensorData[]): SensorData[] {
    return sensors.map((s) => {
      if (!this.history.has(s.id)) this.history.set(s.id, []);
      const window = this.history.get(s.id)!;
      window.push(s.value);
      if (window.length > this.windowSize) window.shift();
      if (window.length < 5) return { ...s, anomaly: false };

      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const std = Math.sqrt(window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / window.length) || 0.001;
      const zScore = Math.abs((s.value - mean) / std);
      const detected = zScore > this.threshold;
      return { ...s, anomaly: s.anomaly || detected };
    });
  }
}

// Simple predictive model (linear regression) for temperature forecast
export function forecastTemperature(values: number[]): number {
  const n = values.length;
  if (n < 2) return values[values.length - 1];
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return Math.round((intercept + slope * n) * 10) / 10; // next point
}
