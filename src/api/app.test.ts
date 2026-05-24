import { apiApp } from './app';

describe('apiApp', () => {
  it('converts a title through the API', async () => {
    const response = await apiApp.request('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'The Lion King',
        options: { mode: 'strict' },
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      emoji: '🦁👑',
      accepted: true,
    });
  });

  it('rejects invalid requests', async () => {
    const response = await apiApp.request('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('rejects deprecated movie clue mode', async () => {
    const response = await apiApp.request('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Jaws', options: { mode: 'movie-clue' } }),
    });

    expect(response.status).toBe(400);
  });

  it('rate limits unauthenticated public conversion requests', async () => {
    const env = { API_PUBLIC_RATE_LIMIT_PER_MINUTE: '1' };
    const headers = {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.10',
    };
    const body = JSON.stringify({ title: 'The Lion King' });

    const firstResponse = await apiApp.request(
      '/api/convert',
      { method: 'POST', headers, body },
      env,
    );
    const secondResponse = await apiApp.request(
      '/api/convert',
      { method: 'POST', headers, body },
      env,
    );

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers.get('X-Access-Tier')).toBe('public');
    expect(secondResponse.status).toBe(429);
    expect(secondResponse.headers.get('Retry-After')).toBeTruthy();
  });

  it('lets a valid admin token bypass public rate limits', async () => {
    const env = {
      API_ADMIN_TOKEN: 'test-token',
      API_PUBLIC_RATE_LIMIT_PER_MINUTE: '1',
    };
    const headers = {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.11',
    };
    const body = JSON.stringify({ title: 'The Lion King' });

    const firstResponse = await apiApp.request(
      '/api/convert',
      { method: 'POST', headers, body },
      env,
    );
    const secondResponse = await apiApp.request(
      '/api/convert',
      { method: 'POST', headers, body },
      env,
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.headers.get('X-Access-Tier')).toBe('admin');
  });

  it('rejects an invalid bearer token instead of falling back to public access', async () => {
    const response = await apiApp.request(
      '/api/convert',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer wrong-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'The Lion King' }),
      },
      { API_ADMIN_TOKEN: 'test-token' },
    );

    expect(response.status).toBe(401);
  });
});
