import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    api_burst: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RPS || 100),
      timeUnit: '1s',
      duration: __ENV.DURATION || '60s',
      preAllocatedVUs: 100,
      maxVUs: 600,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';
  const response = http.get(`${baseUrl}/api/health`);
  check(response, { 'health returns 200': (result) => result.status === 200 });
  sleep(0.1);
}