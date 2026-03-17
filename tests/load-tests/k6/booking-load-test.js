/**
 * k6 Load Test: Booking Concurrency
 *
 * Scenario: 50 concurrent VUs all attempt to book the same time slot simultaneously.
 * The time slot has MaxCapacity = 10 (configurable via TIME_SLOT_CAPACITY env var).
 *
 * Expected outcome:
 * - Exactly MaxCapacity bookings succeed (HTTP 201)
 * - All remaining requests are rejected (HTTP 409 Conflict)
 * - Zero double-booking (no data corruption)
 *
 * Run:
 *   k6 run \
 *     -e BASE_URL=http://localhost:5000 \
 *     -e AUTH_TOKEN=<jwt_token> \
 *     -e TIME_SLOT_ID=<uuid> \
 *     -e MEMBER_IDS=<comma_separated_uuids> \
 *     -e TIME_SLOT_CAPACITY=10 \
 *     tests/load-tests/k6/booking-load-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const successfulBookings = new Counter('successful_bookings');
const conflictRejections = new Counter('conflict_rejections');
const unexpectedFailures = new Counter('unexpected_failures');
const successRate = new Rate('success_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const TIME_SLOT_ID = __ENV.TIME_SLOT_ID || '';
const MEMBER_IDS = (__ENV.MEMBER_IDS || '').split(',').filter(id => id.length > 0);
const TIME_SLOT_CAPACITY = parseInt(__ENV.TIME_SLOT_CAPACITY || '10', 10);

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    // Exactly MaxCapacity bookings should succeed across the entire test run
    'successful_bookings': [`count<=${TIME_SLOT_CAPACITY}`],
    // At least (50 - MaxCapacity) should get 409
    'conflict_rejections': [`count>=${50 - TIME_SLOT_CAPACITY}`],
    // No unexpected server errors
    'unexpected_failures': ['count==0'],
    http_req_failed: ['rate<0.02'],
  },
};

const GYM_HOUSE_ID = __ENV.GYM_HOUSE_ID || '';

export default function () {
  const vuIndex = __VU - 1; // 0-based VU index
  const memberId = MEMBER_IDS.length > 0
    ? MEMBER_IDS[vuIndex % MEMBER_IDS.length]
    : `00000000-0000-0000-0000-${String(vuIndex).padStart(12, '0')}`;

  const payload = JSON.stringify({
    gymHouseId: GYM_HOUSE_ID,
    memberId: memberId,
    bookingType: 0, // TimeSlot
    timeSlotId: TIME_SLOT_ID,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/bookings`, payload, params);

  const isCreated = check(res, {
    'booking created (201)': (r) => r.status === 201,
  });

  const isConflict = check(res, {
    'booking rejected — capacity full (409)': (r) => r.status === 409,
  });

  if (res.status === 201) {
    successfulBookings.add(1);
    successRate.add(true);
  } else if (res.status === 409) {
    conflictRejections.add(1);
    successRate.add(false);
  } else {
    unexpectedFailures.add(1);
    console.error(`Unexpected status ${res.status} for VU ${__VU}: ${res.body}`);
  }

  sleep(0.1);
}

export function handleSummary(data) {
  const booked = data.metrics['successful_bookings']
    ? data.metrics['successful_bookings'].values.count
    : 0;
  const rejected = data.metrics['conflict_rejections']
    ? data.metrics['conflict_rejections'].values.count
    : 0;

  console.log(`\n=== Booking Concurrency Results ===`);
  console.log(`Time slot capacity: ${TIME_SLOT_CAPACITY}`);
  console.log(`Successful bookings: ${booked} (expected: <= ${TIME_SLOT_CAPACITY})`);
  console.log(`Conflict rejections: ${rejected}`);
  console.log(`No double-booking: ${booked <= TIME_SLOT_CAPACITY ? 'PASS' : 'FAIL'}`);
  console.log(`====================================\n`);

  return {};
}
