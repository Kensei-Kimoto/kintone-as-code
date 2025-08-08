import fs from 'fs/promises';
import path from 'path';

const configTemplate = `import dotenv from 'dotenv';
dotenv.config();

export default {
  default: 'production',
  environments: {
    production: {
      auth: {
        baseUrl: process.env.KINTONE_BASE_URL,
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
        // or use API token
        // apiToken: process.env.KINTONE_API_TOKEN,
      }
    },
    development: {
      auth: {
        baseUrl: process.env.KINTONE_DEV_BASE_URL || process.env.KINTONE_BASE_URL,
        username: process.env.KINTONE_DEV_USERNAME || process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_DEV_PASSWORD || process.env.KINTONE_PASSWORD,
        // or use API token
        // apiToken: process.env.KINTONE_DEV_API_TOKEN,
      }
    }
  }
};
`;

const envExampleTemplate = `# Kintone authentication
KINTONE_BASE_URL=https://your-domain.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
# or use API token instead of username/password
# KINTONE_API_TOKEN=your-api-token

# Development environment (optional - defaults to production values if not set)
# KINTONE_DEV_BASE_URL=https://dev-domain.cybozu.com
# KINTONE_DEV_USERNAME=dev-username
# KINTONE_DEV_PASSWORD=dev-password
# or use API token
# KINTONE_DEV_API_TOKEN=your-dev-api-token

# App IDs (for use in your schemas)
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
  console.log('\nNext steps:');
  console.log('1. Install dotenv: npm install dotenv');
  console.log('2. Copy .env.example to .env and update with your credentials');
  console.log('3. Start managing your Kintone apps as code!');
};