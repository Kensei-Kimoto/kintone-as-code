import fs from 'fs';
import path from 'path';

/**
 * Determines if an env file should be loaded based on CLI arguments and security checks
 * @param argv - Command line arguments
 * @param envFilePath - Path to the env file to check
 * @returns true if the file should be loaded, false otherwise
 */
export const shouldLoadEnvFile = (argv: any, envFilePath: string): boolean => {
  // Check if --env-file option is provided
  const envFileOption = argv['env-file'] || argv.envFile;
  
  if (!envFileOption) {
    return false; // No explicit env file requested
  }
  
  // Check if the specified env file exists
  if (!fs.existsSync(envFilePath)) {
    return false; // File doesn't exist
  }
  
  // Security check: validate file permissions (Unix-like systems only)
  if (process.platform !== 'win32') {
    try {
      const stats = fs.statSync(envFilePath);
      const mode = stats.mode;
      
      // Check if file is world-writable (dangerous)
      // 0o002 = world-writable bit
      if (mode & 0o002) {
        console.warn(`Warning: Env file ${envFilePath} is world-writable, skipping for security`);
        return false;
      }
      
      // Check if file is group-writable and we're being strict
      // For now, allow group-writable (0o020) but could be made stricter
      // if (mode & 0o020) {
      //   return false;
      // }
      
    } catch (error) {
      console.warn(`Warning: Could not check permissions for ${envFilePath}:`, error);
      return false;
    }
  }
  
  return true;
};

/**
 * Sets up environment variable loading based on CLI arguments
 * @param argv - Command line arguments
 */
export const setupEnvLoading = async (argv: any): Promise<void> => {
  const envFileOption = argv['env-file'] || argv.envFile;
  
  if (!envFileOption) {
    return; // No env file requested, skip loading
  }
  
  // Resolve the env file path
  const envFilePath = path.resolve(process.cwd(), envFileOption);
  
  // Check if we should load this env file
  if (!shouldLoadEnvFile(argv, envFilePath)) {
    return;
  }
  
  try {
    // Dynamic import to avoid requiring dotenv as a dependency
    const dotenv = await import('dotenv');
    
    // Load the env file without overriding existing environment variables
    dotenv.config({ 
      path: envFilePath,
      override: false // Don't override existing env vars
    });
    
    console.log(`Loaded environment variables from ${envFilePath}`);
    
  } catch (error) {
    // Graceful degradation if dotenv is not available or env file is malformed
    console.warn(`Warning: Could not load env file ${envFilePath}:`, error);
  }
};