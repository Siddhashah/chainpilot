import { describe, it, expect } from 'vitest';
import { makeTokens, verifyToken } from '../../src/utils/tokens.js';

describe('tokens', () => {
  it('signs an access + refresh pair with the correct token types', () => {
    const { access, refresh } = makeTokens('user123');

    const accessPayload = verifyToken(access);
    expect(accessPayload.userId).toBe('user123');
    expect(accessPayload.tokenType).toBe('access');

    const refreshPayload = verifyToken(refresh);
    expect(refreshPayload.userId).toBe('user123');
    expect(refreshPayload.tokenType).toBe('refresh');
  });

  it('throws when verifying a garbage token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });

  it('throws when verifying a token signed with a different secret', () => {
    // Sanity check that jwt verification actually checks the signature,
    // not just that the string is JWT-shaped.
    const fakeToken =
      'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ4In0.invalidSignatureSegmentxxxxxxxxxxxxxxx';
    expect(() => verifyToken(fakeToken)).toThrow();
  });
});
