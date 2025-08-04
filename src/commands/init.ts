import fs from 'fs/promises';
import path from 'path';

const configTemplate = `export default {
  default: 'production',
  environments: {
    production: {
      auth: {
        baseUrl: 'https://your-domain.cybozu.com',
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
        // or use API token
        // apiToken: process.env.KINTONE_API_TOKEN,
      }
    },
    development: {
      auth: {
        baseUrl: 'https://dev.cybozu.com',
        apiToken: process.env.KINTONE_DEV_API_TOKEN,
      }
    }
  }
};
`;

const envExampleTemplate = `# Kintone authentication
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
# or use API token
# KINTONE_API_TOKEN=your-api-token

# Development environment
KINTONE_DEV_API_TOKEN=your-dev-api-token

# App IDs
KINTONE_CUSTOMER_APP_ID=123
KINTONE_PRODUCT_APP_ID=456
`;

export const init = async ({ force }: { force?: boolean | undefined }) => {
  const configPath = path.join(process.cwd(), 'kintone-as-code.config.js');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const appsPath = path.join(process.cwd(), 'apps');

  const fileExists = async (filePath: string) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  };

  if (!force && (await fileExists(configPath) || await fileExists(envExamplePath) || await fileExists(appsPath))) {
    console.error('Error: Files already exist. Use --force to overwrite.');
    return;
  }

  await fs.writeFile(configPath, configTemplate.trim());
  await fs.writeFile(envExamplePath, envExampleTemplate.trim());
  await fs.mkdir(appsPath, { recursive: true });

  console.log('kintone-as-code initialized successfully!');
  console.log('Created:');
  console.log(`- kintone-as-code.config.js`);
  console.log(`- .env.example`);
  console.log(`- apps/`);
};