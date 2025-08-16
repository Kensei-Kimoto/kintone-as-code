import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { exportCommand } from '../export.js';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { loadConfig } from '../../core/config.js';

// モック
vi.mock('@kintone/rest-api-client');
vi.mock('fs/promises');
vi.mock('../../core/config.js');

// process.exit をモック
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

vi.mock('../../core/converter.js', () => ({
  convertKintoneFieldsToSchema: vi.fn().mockReturnValue('// Schema content'),
  generateStaticRecordSchemaCode: vi
    .fn()
    .mockReturnValue('// Record schema content'),
}));

describe('app-ids.ts comma handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExit.mockClear();
  });

  const setupMocks = () => {
    const mockClient = {
      app: { getFormFields: vi.fn().mockResolvedValue({ properties: {} }) },
    };
    
    vi.mocked(KintoneRestAPIClient).mockReturnValue(mockClient as any);
    vi.mocked(loadConfig).mockResolvedValue({
      default: 'test',
      environments: {
        test: {
          auth: {
            baseUrl: 'https://test.cybozu.com',
            username: 'test',
            password: 'test',
          },
        },
      },
    });
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.realpath).mockResolvedValue('/Users/kimotokensei/Desktop/kintone-oss/kintone-as-code');
    vi.mocked(fs.rename).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
  };

  it('should handle existing file with trailing comma correctly', async () => {
    setupMocks();
    
    // Existing file with trailing comma
    const existingContent = `// App IDs for kintone applications
// This file is gitignored by default
export const APP_IDS = {
  EXISTING_APP: 123,
} as const;
`;
    
    vi.mocked(fs.readFile).mockResolvedValue(existingContent);
    
    let writtenContent = '';
    vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
      // Capture content for both direct writes and temp file writes
      if (path.toString().includes('app-ids.ts')) {
        writtenContent = content.toString();
      }
    });

    await exportCommand({
      appId: '456',
      name: 'new-app',
      includeRelated: false,
      includeSubtable: false,
    });

    // Should not have duplicate commas
    expect(writtenContent).not.toContain(',\n,');
    expect(writtenContent).toContain('EXISTING_APP: 123,');
    expect(writtenContent).toContain('NEW_APP: 456,');
  });

  it('should handle existing file with no trailing comma correctly', async () => {
    setupMocks();
    
    // Existing file without trailing comma (edge case)
    const existingContent = `// App IDs for kintone applications
// This file is gitignored by default
export const APP_IDS = {
  EXISTING_APP: 123
} as const;
`;
    
    vi.mocked(fs.readFile).mockResolvedValue(existingContent);
    
    let writtenContent = '';
    vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
      // Capture content for both direct writes and temp file writes
      if (path.toString().includes('app-ids.ts')) {
        writtenContent = content.toString();
      }
    });

    await exportCommand({
      appId: '456',
      name: 'new-app',
      includeRelated: false,
      includeSubtable: false,
    });

    // Should add comma before new entry
    expect(writtenContent).not.toContain(',\n,');
    expect(writtenContent).toContain('EXISTING_APP: 123,');
    expect(writtenContent).toContain('NEW_APP: 456,');
  });

  it('should handle empty APP_IDS object correctly', async () => {
    setupMocks();
    
    // Empty APP_IDS object
    const existingContent = `// App IDs for kintone applications
// This file is gitignored by default
export const APP_IDS = {
} as const;
`;
    
    vi.mocked(fs.readFile).mockResolvedValue(existingContent);
    
    let writtenContent = '';
    vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
      // Capture content for both direct writes and temp file writes
      if (path.toString().includes('app-ids.ts')) {
        writtenContent = content.toString();
      }
    });

    await exportCommand({
      appId: '456',
      name: 'new-app',
      includeRelated: false,
      includeSubtable: false,
    });

    // Should not add comma for first entry
    expect(writtenContent).not.toContain(',\n,');
    expect(writtenContent).toContain('NEW_APP: 456,');
    expect(writtenContent.match(/NEW_APP: 456,/g)).toHaveLength(1);
  });
});