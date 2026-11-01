import { expect, it } from 'vitest';
import { getSite } from '../src/worker/env';

it('reads webhook settings updated by another request', async () => {
  let row = { id: 'settings-test', dodo_webhook_secret: null as string | null };
  const db = {
    prepare: () => ({ bind: () => ({ first: async () => ({ ...row }) }) }),
  } as unknown as D1Database;

  expect((await getSite(db, row.id))?.dodo_webhook_secret).toBeNull();
  row = { ...row, dodo_webhook_secret: 'updated-webhook-secret' };
  expect((await getSite(db, row.id))?.dodo_webhook_secret).toBe('updated-webhook-secret');
});
