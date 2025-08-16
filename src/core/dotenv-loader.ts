import fs from 'fs';
import path from 'path';

// Optional .env loading function with security checks
export async function loadDotenvIfEnabled() {
  // Optional .env loading (opt-in) with permission check
  const envPath = path.join(process.cwd(), '.env');
  if (process.env.KAC_DOTENV === '1' && fs.existsSync(envPath)) {
    try {
      // Permission check (POSIX): require 0600 to avoid leaking secrets via group/others
      if (process.platform !== 'win32') {
        const stats = fs.statSync(envPath);
        if ((stats.mode & 0o077) !== 0) {
          console.warn(`Skipping .env load due to insecure permissions: ${envPath} (expected 0600)`);
          return;
        }
      }
      const dotenv = await import('dotenv');
      dotenv.config({ path: envPath });
    } catch {
      // dotenv not installed or load failed, skip auto-loading
    }
  }
}