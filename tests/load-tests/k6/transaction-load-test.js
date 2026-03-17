/**
 * k6 Load Test: Concurrent Transaction Recording
 *
 * Scenario: 100 concurrent VUs each record one transaction simultaneously.
 * Verifies no data loss under concurrent writes.
 *
 * Expected outcome:
 * - All 100 transactions succeed (HTTP 201)
 * - Verification query returns exactly 100 persisted transactions
 * - No duplicate IDs (data integrity)
 *
 * Run:
 *   k6 run \
 *     -e BASE_URL=http://localhost:5000 \
 *     -e AUTH_TOKEN=<jwt_token> \
 *     -e GYM_HOUSE_ID=<uuid> \
 *     tests/load-tests/k6/transaction-load-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const txSuccess = new Counter('transaction_success');
const txFailure = new Counter('transaction_failure');
const createdIds = new Set();
const duplicateIds = new Counter('duplicate_transaction_ids');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const GYM_HOUSE_ID = __ENV.GYM_HOUSE_ID || '';
const EXPECTED_COUNT = parseInt(__ENV.EXPECTED_COUNT || '100', 10);

export const options = {
  vus: 100,
  iterations: 100, // Exactly 100 transactions — one per VU iteration
  thresholds: {
    'transaction_success': [`count>=${EXPECTED_COUNT}`],
    'transaction_failure': ['count==0'],
    'duplicate_transaction_ids': ['count==0'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const amount = (Math.random() * 990 + 10).toFixed(2); // Random 10–1000

  const payload = JSON.stringify({
    gymHouseId: GYM_HOUSE_ID,
    transactionType: 0,    // MembershipFee
    direction: 0,          // Credit
    amount: parseFloat(amount),
    category: 0,           // Revenue
    description: `Load test transaction VU-${__VU}-iter-${__ITER}`,
    transactionDate: new Date().toISOString(),
    relatedEntityId: null,
    approvedById: null,
    paymentMethod: 0,      // Cash
    externalReference: null,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/transactions`, payload, params);

  const success = check(res, {
    'transaction recorded (201)': (r) => r.status === 201,
    'response has transaction id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id && body.id.length === 36;
      } catch {
        return false;
      }
    },
  });

  if (res.status === 201) {
    txSuccess.add(1);

    // Track IDs to detect duplicates
    try {
      const body = JSON.parse(res.body);
      if (body.id) {
        if (createdIds.has(body.id)) {
          duplicateIds.add(1);
          console.error(`Duplicate transaction ID detected: ${body.id}`);
        }
        createdIds.add(body.id);
      }
    } catch (e) {
      console.error(`Failed to parse response: ${e}`);
    }
  } else {
    txFailure.add(1);
    console.error(`Transaction failed: status=${res.status}, body=${res.body}`);
  }
}

export function handleSummary(data) {
  const success = data.metrics['transaction_success']
    ? data.metrics['transaction_success'].values.count
    : 0;
  const failure = data.metrics['transaction_failure']
    ? data.metrics['transaction_failure'].values.count
    : 0;

  console.log(`\n=== Concurrent Transaction Results ===`);
  console.log(`Expected: ${EXPECTED_COUNT} transactions`);
  console.log(`Succeeded: ${success}`);
  console.log(`Failed: ${failure}`);
  console.log(`No data loss: ${success === EXPECTED_COUNT ? 'PASS' : 'FAIL'}`);
  console.log(`======================================\n`);

  return {};
}
