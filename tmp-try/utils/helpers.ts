// Helper functions for kintone-as-code schemas

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