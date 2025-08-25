const crypto = require('crypto');

// Functions extracted from server.js for testing
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '0.0.0.0';
}

function generateServerUserId(clientIP) {
  return crypto.createHash('sha256').update(clientIP).digest('hex').substring(0, 16);
}

describe('IP Handling', () => {
  describe('getClientIP', () => {
    test('should return x-forwarded-for when present', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      };
      expect(getClientIP(req)).toBe('192.168.1.100');
    });

    test('should return connection.remoteAddress when x-forwarded-for is not present', () => {
      const req = {
        headers: {},
        connection: { remoteAddress: '10.0.0.1' }
      };
      expect(getClientIP(req)).toBe('10.0.0.1');
    });

    test('should return socket.remoteAddress when connection.remoteAddress is not available', () => {
      const req = {
        headers: {},
        connection: {},
        socket: { remoteAddress: '127.0.0.1' }
      };
      expect(getClientIP(req)).toBe('127.0.0.1');
    });

    test('should return connection.socket.remoteAddress as fallback', () => {
      const req = {
        headers: {},
        connection: { 
          socket: { remoteAddress: '172.16.0.1' }
        },
        socket: {}
      };
      expect(getClientIP(req)).toBe('172.16.0.1');
    });

    test('should return default IP when no IP sources are available', () => {
      const req = { 
        headers: {},
        connection: {},
        socket: {}
      };
      expect(getClientIP(req)).toBe('0.0.0.0');
    });

    test('should handle IPv6 addresses', () => {
      const req = {
        headers: { 'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }
      };
      expect(getClientIP(req)).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('generateServerUserId', () => {
    test('should generate consistent hash for same IP', () => {
      const ip = '192.168.1.100';
      const userId1 = generateServerUserId(ip);
      const userId2 = generateServerUserId(ip);
      expect(userId1).toBe(userId2);
    });

    test('should generate different hashes for different IPs', () => {
      const ip1 = '192.168.1.100';
      const ip2 = '192.168.1.101';
      const userId1 = generateServerUserId(ip1);
      const userId2 = generateServerUserId(ip2);
      expect(userId1).not.toBe(userId2);
    });

    test('should generate 16-character hex string', () => {
      const ip = '127.0.0.1';
      const userId = generateServerUserId(ip);
      expect(userId).toHaveLength(16);
      expect(userId).toMatch(/^[a-f0-9]{16}$/);
    });

    test('should handle IPv6 addresses', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const userId = generateServerUserId(ip);
      expect(userId).toHaveLength(16);
      expect(userId).toMatch(/^[a-f0-9]{16}$/);
    });

    test('should handle empty string', () => {
      const ip = '';
      const userId = generateServerUserId(ip);
      expect(userId).toHaveLength(16);
      expect(userId).toMatch(/^[a-f0-9]{16}$/);
    });
  });
});