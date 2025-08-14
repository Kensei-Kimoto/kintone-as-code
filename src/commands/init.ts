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
      }
    },
    development: {
      auth: {
        baseUrl: process.env.KINTONE_DEV_BASE_URL || process.env.KINTONE_BASE_URL,
        username: process.env.KINTONE_DEV_USERNAME || process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_DEV_PASSWORD || process.env.KINTONE_PASSWORD,
      }
    }
  }
};
`;

const envExampleTemplate = `# Kintone authentication (CLI はユーザー/パスワードのみ対応)
KINTONE_BASE_URL=https://your-domain.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password

# Development environment (optional - defaults to production values if not set)
# KINTONE_DEV_BASE_URL=https://dev-domain.cybozu.com
# KINTONE_DEV_USERNAME=dev-username
# KINTONE_DEV_PASSWORD=dev-password
`;

const gitignoreTemplate = `# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.*.local

# Build output
dist/
build/
*.js
*.js.map
*.d.ts
!kintone-as-code.config.js

# App IDs (contains actual app IDs)
utils/app-ids.ts

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
`;

const helpersTemplate = `// Helper functions for kintone-as-code schemas

/**
 * Helper function to define app schema with type safety
 */
export function defineAppSchema<T extends {
  appId: number | string;
  name: string;
  description?: string;
  fieldsConfig: any
}>(schema: T): T {
  return schema;
}
`;

export const init = async ({
  force,
  noEsmRewrite,
}: {
  force?: boolean | undefined;
  noEsmRewrite?: boolean;
}) => {
  const configPath = path.join(process.cwd(), 'kintone-as-code.config.js');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const appsPath = path.join(process.cwd(), 'apps');
  const utilsPath = path.join(process.cwd(), 'utils');
  const helpersPath = path.join(utilsPath, 'helpers.ts');
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  const fileExists = async (filePath: string) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  };

  if (
    !force &&
    ((await fileExists(configPath)) ||
      (await fileExists(envExamplePath)) ||
      (await fileExists(appsPath)))
  ) {
    console.error('Error: Files already exist. Use --force to overwrite.');
    return;
  }

  await fs.writeFile(configPath, configTemplate.trim());
  await fs.writeFile(envExamplePath, envExampleTemplate.trim());
  await fs.writeFile(gitignorePath, gitignoreTemplate.trim());
  await fs.mkdir(appsPath, { recursive: true });
  await fs.mkdir(utilsPath, { recursive: true });
  await fs.writeFile(helpersPath, helpersTemplate.trim());

  // Update package.json to use ES modules if it exists (unless suppressed)
  if (!noEsmRewrite && (await fileExists(packageJsonPath))) {
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
      if (!packageJson.dependencies['kintone-as-code']) {
        packageJson.dependencies['kintone-as-code'] = '^0.6.0';
      }
      if (!packageJson.dependencies['kintone-effect-schema']) {
        packageJson.dependencies['kintone-effect-schema'] = '^0.8.0';
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

      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + '\n'
      );
      console.log('Updated package.json with ES modules and dependencies');
    } catch (error) {
      console.warn(
        'Could not update package.json. Please check the file manually.'
      );
    }
  } else if (!(await fileExists(packageJsonPath))) {
    // Create a package.json if it doesn't exist
    const completePackageJson = {
      name: path.basename(process.cwd()),
      version: '1.0.0',
      // Respect suppression: omit type: module when noEsmRewrite is true
      ...(noEsmRewrite ? {} : { type: 'module' }),
      description: 'Kintone application managed as code',
      scripts: {
        export: 'kintone-as-code export',
        apply: 'kintone-as-code apply',
        create: 'kintone-as-code create',
      },
      dependencies: {
        'kintone-as-code': '^0.6.0',
        'kintone-effect-schema': '^0.8.0',
        dotenv: '^16.3.1',
        effect: '^3.0.0',
      },
    } as Record<string, unknown>;
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(completePackageJson, null, 2) + '\n'
    );
    console.log(
      noEsmRewrite
        ? 'Created package.json without ESM rewrite (CJS-friendly)'
        : 'Created package.json with ES modules and dependencies'
    );
  } else if (noEsmRewrite) {
    console.log('Skipped package.json ESM rewrite as requested.');
  }

  console.log('kintone-as-code initialized successfully!');
  console.log('Created:');
  console.log(`- kintone-as-code.config.js`);
  console.log(`- .env.example`);
  console.log(`- .gitignore`);
  console.log(`- apps/`);
  console.log(`- utils/helpers.ts`);
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Copy .env.example to .env and update with your credentials');
  console.log('3. Start managing your Kintone apps as code!');
};
