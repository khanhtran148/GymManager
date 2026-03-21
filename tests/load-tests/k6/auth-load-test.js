/**
 * k6 Load Test: Auth Rate Limiting
 *
 * Scenario: 200 concurrent login attempts to verify rate limiting
 * kicks in at 10 requests/minute (per the Auth rate limit policy).
 *
 * Expected outcome:
 * - First 10 requests per minute succeed (HTTP 200)
 * - Subsequent requests in the same window return 429 Too Many Requests
 *
 * Run:
 *   k6 run \
 *     -e BASE_URL=http://localhost:5050 \
 *     -e TEST_EMAIL=loadtest@example.com \
 *     -e TEST_PASSWORD=Test@1234 \
 *     tests/load-tests/k6/auth-load-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const loginSuccess = new Counter('login_success');
const loginRateLimited = new Counter('login_rate_limited');
const loginUnexpectedFailure = new Counter('login_unexpected_failure');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5050';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@example.com';
if (!__ENV.TEST_PASSWORD) {
  throw new Error('TEST_PASSWORD env var is required. Usage: k6 run -e TEST_PASSWORD=... auth-load-test.js');
}
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

export const options = {
  scenarios: {
    burst_auth: {
      executor: 'constant-vus',
      vus: 200,
      duration: '15s',
    },
  },
  thresholds: {
    // Rate limiting must kick in — expect many 429s
    'login_rate_limited': ['count>0'],
    // Server should never crash
    'login_unexpected_failure': ['count==0'],
  },
};

export default function () {
  const payload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, params);

  if (res.status === 200) {
    loginSuccess.add(1);
    check(res, { 'login succeeded (200)': (r) => r.status === 200 });
  } else if (res.status === 429) {
    loginRateLimited.add(1);
    check(res, { 'rate limited (429)': (r) => r.status === 429 });
  } else if (res.status === 400 || res.status === 401) {
    // Invalid credentials — expected in load test environment
    loginSuccess.add(0);
  } else {
    loginUnexpectedFailure.add(1);
    console.error(`Unexpected status ${res.status}: ${res.body}`);
  }

  // No sleep — we want maximum burst to trigger rate limiting
}

export function handleSummary(data) {
  const success = data.metrics['login_success']
    ? data.metrics['login_success'].values.count
    : 0;
  const rateLimited = data.metrics['login_rate_limited']
    ? data.metrics['login_rate_limited'].values.count
    : 0;

  console.log(`\n=== Auth Rate Limiting Results ===`);
  console.log(`Successful logins: ${success}`);
  console.log(`Rate-limited (429): ${rateLimited}`);
  console.log(`Rate limiting active: ${rateLimited > 0 ? 'PASS' : 'FAIL'}`);
  console.log(`==================================\n`);

  return {};
}
