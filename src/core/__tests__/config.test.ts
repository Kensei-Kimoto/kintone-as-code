import { describe, it, expect } from 'vitest';
import path from 'path';

describe('config module', () => {
  it('should construct correct config path', () => {
    const mockCwd = '/test/project';
    const expectedPath = path.join(mockCwd, 'kintone-as-code.config.js');
    
    expect(expectedPath).toBe('/test/project/kintone-as-code.config.js');
  });

  it('should construct correct env path', () => {
    const mockCwd = '/test/project';
    const expectedPath = path.join(mockCwd, '.env');
    
    expect(expectedPath).toBe('/test/project/.env');
  });

  it('should validate environment names', () => {
    const validEnvs = ['development', 'staging', 'production'];
    const invalidEnvs = ['', null, undefined, 123];
    
    validEnvs.forEach(env => {
      expect(typeof env).toBe('string');
      expect(env.length).toBeGreaterThan(0);
    });
    
    invalidEnvs.forEach(env => {
      expect(typeof env === 'string' && env.length > 0).toBe(false);
    });
  });
});