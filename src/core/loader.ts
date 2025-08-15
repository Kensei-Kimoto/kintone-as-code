import { pathToFileURL } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import type { AppSchema } from '../types.js';

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function loadSchema(schemaPath: string): Promise<AppSchema> {
  try {
    const abs = path.resolve(process.cwd(), schemaPath);
    const ext = path.extname(abs).toLowerCase();

    // If JS/MJS is provided, import directly
    if (ext === '.js' || ext === '.mjs') {
      const fileUrl = pathToFileURL(abs).href;
      const module = await import(fileUrl);
      if (!('default' in module))
        throw new Error('Schema file must export default');
      return module.default as AppSchema;
    }

    // If TS is provided, try nearby JS next to it first
    if (ext === '.ts' || ext === '.mts' || ext === '') {
      const jsCandidate = abs.replace(/\.(ts|mts)?$/, '.js');
      if (await fileExists(jsCandidate)) {
        const fileUrl = pathToFileURL(jsCandidate).href;
        const module = await import(fileUrl);
        if (!('default' in module))
          throw new Error('Schema file must export default');
        return module.default as AppSchema;
      }

      // Transpile TS to ESM with esbuild into a temp .mjs and import
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kac-schema-'));
      const outFile = path.join(tempDir, 'schema.mjs');
      const shimPath = path.join(tempDir, 'kac-shim.mjs');
      await fs.writeFile(
        shimPath,
        [
          'export const defineAppSchema = (schema) => schema;\n',
          'export const getAppId = (name) => {',
          '  const v = process.env[name];',
          '  return v == null || v === "" ? "0" : String(v);',
          '};\n',
        ].join('')
      );

      const esb = await import('esbuild');
      // Alias 'kintone-as-code' to lightweight shim (avoid bundling full package)
      const aliasPlugin = {
        name: 'alias-kintone-as-code',
        setup(build: any) {
          build.onResolve({ filter: /^kintone-as-code$/ }, () => ({
            path: shimPath,
          }));
        },
      } as const;
      try {
        await esb.build({
          entryPoints: [abs],
          outfile: outFile,
          platform: 'node',
          format: 'esm',
          target: 'es2022',
          bundle: true,
          absWorkingDir: path.dirname(abs),
          sourcemap: false,
          logLevel: 'silent',
          plugins: [aliasPlugin],
        });

        const fileUrl = pathToFileURL(outFile).href;
        const module = await import(fileUrl);
        if (!('default' in module))
          throw new Error('Schema file must export default');
        return module.default as AppSchema;
      } finally {
        // Best-effort cleanup
        try {
          await fs.rm(outFile, { force: true });
        } catch {}
        try {
          await fs.rm(shimPath, { force: true });
        } catch {}
        try {
          await fs.rmdir(tempDir, { recursive: true });
        } catch {}
      }
    }

    throw new Error(`Unsupported schema file extension: ${ext}`);
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error}`);
  }
}
