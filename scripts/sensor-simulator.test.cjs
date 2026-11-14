const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AnomalyDetector,
  forecastTemperature,
  generateSensorReadings,
} = require('../.test-build/sensor-simulator.js');

function sample(id, value, anomaly = false) {
  return {
    id,
    type: 'temperature',
    value,
    timestamp: 1_700_000_000_000,
    anomaly,
    lat: 34.1,
    lng: -118.1,
    building: 'Library',
  };
}

test('sensor generation is deterministic when time and random source are supplied', () => {
  const options = {
    now: new Date('2025-01-15T12:00:00.000Z'),
    random: () => 0.5,
  };
  const first = generateSensorReadings(options);
  const second = generateSensorReadings(options);
  assert.equal(first.length, 50);
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((sensor) => sensor.id)).size, 50);
  assert.ok(first.every((sensor) => Number.isFinite(sensor.value)));
});

test('anomaly detector compares a candidate with prior samples only', () => {
  const detector = new AnomalyDetector(20, 2.5, 5, 0.5);
  for (let i = 0; i < 5; i += 1) {
    const result = detector.detect([sample('sensor-a', 20)]);
    assert.equal(result[0].anomaly, false);
  }
  const [spike] = detector.detect([sample('sensor-a', 30)]);
  assert.equal(spike.anomaly, true);
});

test('injected anomaly labels survive detector warm-up', () => {
  const detector = new AnomalyDetector();
  const [labelled] = detector.detect([sample('sensor-b', 20, true)]);
  assert.equal(labelled.anomaly, true);
});

test('sensor histories are isolated and can be reset', () => {
  const detector = new AnomalyDetector(20, 2.5, 2, 0.5);
  detector.detect([sample('baseline', 10), sample('other', 100)]);
  const [candidate] = detector.detect([sample('baseline', 10)]);
  assert.equal(candidate.anomaly, false);
  detector.reset('baseline');
  const [afterReset] = detector.detect([sample('baseline', 50)]);
  assert.equal(afterReset.anomaly, false);
});

test('linear regression forecasts the next point on a straight trend', () => {
  assert.equal(forecastTemperature([20, 21, 22]), 23);
  assert.equal(forecastTemperature([18]), 18);
});

test('forecast rejects empty or non-finite observations', () => {
  assert.throws(() => forecastTemperature([]), RangeError);
  assert.throws(() => forecastTemperature([20, Number.NaN]), RangeError);
});

test('sensor generator rejects invalid timestamps', () => {
  assert.throws(
    () => generateSensorReadings({ now: new Date(Number.NaN) }),
    RangeError,
  );
});
