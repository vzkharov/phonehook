import { env } from 'bun';

const apiKey = env.VIRTUALSMS_API_KEY;

if (!apiKey) {
  throw new Error('VIRTUALSMS_API_KEY is not set');
}

const baseUrl = 'https://api.virtualsms.de/stubs/handler_api?';

const params = new URLSearchParams({
  action: 'getNumber',
  service: 'acz',
  country: '43', // Germany
  api_key: apiKey,
  // maxPrice: '2',
});

// Purchase a number
const response = await fetch(baseUrl + params.toString());

if (!response.ok) {
  console.error('error purchasing number', response);
  process.exit(1);
}

try {
  const data = await response.text();
  console.info('purchased number', data);
} catch (error) {
  console.error('error purchasing number', error);
}
