import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createAdminSession,
  readAdminSession,
  getSessionCookie,
  adminSessionLifetimeSeconds,
} from './session.js';
import { hashAdminPassword, verifyAdminPassword } from './password.js';

describe('admin password and stateless session', () => {
  it('uses salted scrypt and rejects wrong passwords and unsupported hash parameters', async () => {
    const hash = await hashAdminPassword('Test only password 8492!');
    expect(await verifyAdminPassword('Test only password 8492!', hash)).toBe(true);
    expect(await verifyAdminPassword('Wrong test password', hash)).toBe(false);
    expect(
      await verifyAdminPassword('Test only password 8492!', hash.replace('$32768$', '$2$')),
    ).toBe(false);
    expect(await hashAdminPassword('Test only password 8492!')).not.toBe(hash);
    await expect(hashAdminPassword('short')).rejects.toThrow();
  });
  it('rejects tampering, expiry, future sessions and rotated credentials or secrets', () => {
    const config = {
      username: 'test-admin',
      passwordHash: 'test hash',
      sessionSecret: randomBytes(32).toString('hex'),
      cvSigningSecret: randomBytes(32).toString('hex'),
    };
    const now = Date.now();
    const session = createAdminSession(config, now);
    expect(readAdminSession(session.cookie, config, now)?.csrfToken).toBe(session.csrfToken);
    expect(readAdminSession(undefined, config)).toBeUndefined();
    expect(readAdminSession(`${session.cookie}a`, config)).toBeUndefined();
    expect(readAdminSession(`a${session.cookie.slice(1)}`, config)).toBeUndefined();
    expect(
      readAdminSession(session.cookie, config, now + adminSessionLifetimeSeconds * 1000),
    ).toBeUndefined();
    expect(
      readAdminSession(createAdminSession(config, now + 60_000).cookie, config, now),
    ).toBeUndefined();
    expect(
      readAdminSession(
        session.cookie,
        { ...config, sessionSecret: randomBytes(32).toString('hex') },
        now,
      ),
    ).toBeUndefined();
    expect(
      readAdminSession(session.cookie, { ...config, passwordHash: 'rotated hash' }, now),
    ).toBeUndefined();
    expect(
      readAdminSession(session.cookie, { ...config, username: 'changed-user' }, now),
    ).toBeUndefined();
  });
  it('rejects duplicate or lookalike cookie names', () => {
    expect(getSessionCookie('other=a; rozgar-admin=value', 'rozgar-admin')).toBe('value');
    expect(getSessionCookie('rozgar-admin=a; rozgar-admin=b', 'rozgar-admin')).toBeUndefined();
    expect(getSessionCookie('xrozgar-admin=a', 'rozgar-admin')).toBeUndefined();
  });
});
