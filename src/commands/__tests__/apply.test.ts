import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyCommand as _applyCommand } from '../apply.js';
import { loadConfig } from '../../core/config.js';
import { loadSchema } from '../../core/loader.js';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';

vi.mock('@kintone/rest-api-client');
vi.mock('../../core/config.js');
vi.mock('../../core/loader.js');

// Re-import after mocks to capture the mocked modules
const applyCommand = _applyCommand;

describe('apply --add-subtable-child', () => {
  const mockClient = {
    app: {
      getFormFields: vi.fn(),
      updateFormFields: vi.fn(),
      addFormFields: vi.fn(),
      deployApp: vi.fn(),
    },
  } as unknown as KintoneRestAPIClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    KintoneRestAPIClient.mockImplementation(() => mockClient);
    // config
    // @ts-ignore
    loadConfig.mockResolvedValue({
      default: 'test',
      environments: {
        test: {
          auth: {
            baseUrl: 'https://example.cybozu.com',
            username: 'user',
            password: 'pass',
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds missing subtable child fields when flag is on', async () => {
    // schema: SUBTABLE with child 商品名
    // @ts-ignore
    loadSchema.mockResolvedValue({
      appId: 123,
      fieldsConfig: {
        properties: {
          サブテーブル: {
            type: 'SUBTABLE',
            code: 'サブテーブル',
            fields: {
              商品名: { type: 'SINGLE_LINE_TEXT', code: '商品名', label: '商品名' },
            },
          },
        },
      },
    });

    // current form: SUBTABLE exists without 子 field
    // @ts-ignore
    mockClient.app.getFormFields.mockResolvedValue({
      properties: {
        サブテーブル: {
          type: 'SUBTABLE',
          code: 'サブテーブル',
          fields: {},
        },
      },
    });

    // @ts-ignore
    mockClient.app.addFormFields.mockResolvedValue({});
    // @ts-ignore
    mockClient.app.deployApp.mockResolvedValue({});

    await applyCommand({
      appId: '123',
      schema: 'apps/dummy.schema.ts',
      env: 'test',
      addSubtableChild: true,
    } as any);

    expect(mockClient.app.addFormFields).toHaveBeenCalledWith({
      app: '123',
      properties: {
        サブテーブル: {
          type: 'SUBTABLE',
          code: 'サブテーブル',
          fields: {
            商品名: { type: 'SINGLE_LINE_TEXT', code: '商品名', label: '商品名' },
          },
        },
      },
    });
    expect(mockClient.app.deployApp).toHaveBeenCalled();
  });

  it('does not add child fields when flag is off', async () => {
    // @ts-ignore
    loadSchema.mockResolvedValue({
      appId: 123,
      fieldsConfig: {
        properties: {
          サブテーブル: {
            type: 'SUBTABLE',
            code: 'サブテーブル',
            fields: {
              商品名: { type: 'SINGLE_LINE_TEXT', code: '商品名', label: '商品名' },
            },
          },
        },
      },
    });
    // @ts-ignore
    mockClient.app.getFormFields.mockResolvedValue({
      properties: {
        サブテーブル: {
          type: 'SUBTABLE',
          code: 'サブテーブル',
          fields: {},
        },
      },
    });

    await applyCommand({
      appId: '123',
      schema: 'apps/dummy.schema.ts',
      env: 'test',
      addSubtableChild: false,
    } as any);

    expect(mockClient.app.addFormFields).not.toHaveBeenCalled();
  });
});
