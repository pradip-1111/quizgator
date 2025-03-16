
/**
 * UUID utility functions
 */

/**
 * Validates if a string is a properly formatted UUID
 * @param id String to validate as UUID
 * @returns boolean indicating if the string is a valid UUID
 */
export const isValidUuid = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Generates a new cryptographically secure UUID
 * @returns A new UUID string
 */
export const generateUuid = (): string => {
  return crypto.randomUUID();
};

/**
 * Ensures a value is a valid UUID, generating a new one if invalid
 * @param id Potential UUID to validate
 * @returns Valid UUID (either the original if valid, or a new one)
 */
export const ensureValidUuid = (id: string | null | undefined): string => {
  if (!id || !isValidUuid(id)) {
    console.log(`Invalid UUID detected: ${id}, generating replacement`);
    return generateUuid();
  }
  return id;
};

/**
 * Deeply sanitizes an object by ensuring all properties that appear to be UUIDs are valid
 * @param obj Object to sanitize
 * @returns New object with all UUIDs validated
 */
export const sanitizeUuidsInObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Create a new object to avoid mutating the original
  const result = { ...obj } as Record<string, any>;
  
  // Process regular properties
  Object.entries(result).forEach(([key, value]) => {
    // If the key is 'id' or ends with '_id', ensure it's a valid UUID
    if ((key === 'id' || key.endsWith('_id')) && typeof value === 'string') {
      result[key] = ensureValidUuid(value);
    } 
    // Recursively process nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeUuidsInObject(value);
    }
    // Process arrays
    else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (item && typeof item === 'object') {
          return sanitizeUuidsInObject(item);
        }
        return item;
      });
    }
  });
  
  return result as T;
};
