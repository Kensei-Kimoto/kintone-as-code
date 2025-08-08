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
  const packageJsonPath = path.join(process.cwd(), 'package.json');

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

  // Update package.json to use ES modules if it exists
  if (await fileExists(packageJsonPath)) {
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      
      // Set type to module if not already set
      if (packageJson.type !== 'module') {
        packageJson.type = 'module';
      }
      
      // Add necessary dependencies if not present
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      // Add required dependencies for schemas to work
      if (!packageJson.dependencies['kintone-effect-schema']) {
        packageJson.dependencies['kintone-effect-schema'] = '^0.7.1';
      }
      if (!packageJson.dependencies['dotenv']) {
        packageJson.dependencies['dotenv'] = '^16.3.1';
      }
      if (!packageJson.dependencies['effect']) {
        packageJson.dependencies['effect'] = '^3.0.0';
      }
      
      // Add helpful scripts
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      if (!packageJson.scripts['export']) {
        packageJson.scripts['export'] = 'kintone-as-code export';
      }
      if (!packageJson.scripts['apply']) {
        packageJson.scripts['apply'] = 'kintone-as-code apply';
      }
      if (!packageJson.scripts['create']) {
        packageJson.scripts['create'] = 'kintone-as-code create';
      }
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('Updated package.json with ES modules and dependencies');
    } catch (error) {
      console.warn('Could not update package.json. Please check the file manually.');
    }
  } else {
    // Create a complete package.json if it doesn't exist
    const completePackageJson = {
      name: path.basename(process.cwd()),
      version: '1.0.0',
      type: 'module',
      description: 'Kintone application managed as code',
      scripts: {
        'export': 'kintone-as-code export',
        'apply': 'kintone-as-code apply',
        'create': 'kintone-as-code create'
      },
      dependencies: {
        'kintone-effect-schema': '^0.7.1',
        'dotenv': '^16.3.1',
        'effect': '^3.0.0'
      }
    };
    await fs.writeFile(packageJsonPath, JSON.stringify(completePackageJson, null, 2) + '\n');
    console.log('Created package.json with ES modules and dependencies');
  }

  console.log('kintone-as-code initialized successfully!');
  console.log('Created:');
  console.log(`- kintone-as-code.config.js`);
  console.log(`- .env.example`);
  console.log(`- apps/`);
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Copy .env.example to .env and update with your credentials');
  console.log('3. Start managing your Kintone apps as code!');
};