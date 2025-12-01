/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at server startup.
 * Throws descriptive errors if any are missing or malformed.
 */

interface ValidationResult {
  name: string;
  valid: boolean;
  error?: string;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate JWT format (basic check - looks like a JWT)
 */
function isValidJWT(token: string): boolean {
  // JWT format: header.payload.signature (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Each part should be base64url encoded (alphanumeric, -, _)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64UrlRegex.test(part) && part.length > 0);
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): void {
  const results: ValidationResult[] = [];

  // SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    results.push({
      name: 'SUPABASE_URL or VITE_SUPABASE_URL',
      valid: false,
      error: 'Missing required environment variable',
    });
  } else if (!isValidUrl(supabaseUrl)) {
    results.push({
      name: 'SUPABASE_URL or VITE_SUPABASE_URL',
      valid: false,
      error: `Invalid URL format: ${supabaseUrl}`,
    });
  } else {
    results.push({
      name: 'SUPABASE_URL or VITE_SUPABASE_URL',
      valid: true,
    });
  }

  // SUPABASE_SERVICE_ROLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    results.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      valid: false,
      error: 'Missing required environment variable',
    });
  } else if (!isValidJWT(serviceRoleKey)) {
    results.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      valid: false,
      error: 'Invalid JWT format (should be a valid Supabase service role key)',
    });
  } else {
    results.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      valid: true,
    });
  }

  // VITE_SUPABASE_URL (should match SUPABASE_URL if both are set)
  const viteSupabaseUrl = process.env.VITE_SUPABASE_URL;
  if (viteSupabaseUrl && supabaseUrl && viteSupabaseUrl !== supabaseUrl) {
    results.push({
      name: 'VITE_SUPABASE_URL',
      valid: false,
      error: `VITE_SUPABASE_URL (${viteSupabaseUrl}) does not match SUPABASE_URL (${supabaseUrl})`,
    });
  } else if (viteSupabaseUrl) {
    results.push({
      name: 'VITE_SUPABASE_URL',
      valid: true,
    });
  }

  // VITE_SUPABASE_ANON_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    results.push({
      name: 'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY',
      valid: false,
      error: 'Missing required environment variable',
    });
  } else if (!isValidJWT(anonKey)) {
    results.push({
      name: 'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY',
      valid: false,
      error: 'Invalid JWT format (should be a valid Supabase anon key)',
    });
  } else {
    results.push({
      name: 'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY',
      valid: true,
    });
  }

  // Check for any validation failures
  const failures = results.filter(r => !r.valid);

  if (failures.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed\n');
    console.error('='.repeat(60));
    
    failures.forEach(result => {
      console.error(`\n❌ ${result.name}`);
      if (result.error) {
        console.error(`   Error: ${result.error}`);
      }
    });

    console.error('\n' + '='.repeat(60));
    console.error('\n💡 Please check your .env files and ensure all required variables are set correctly.');
    console.error('   Required variables:');
    console.error('   - SUPABASE_URL or VITE_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('   - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
    console.error('\n');

    throw new Error('Environment variable validation failed');
  }

  // Log success
  console.log('✅ Environment variables validated successfully');
  const validCount = results.filter(r => r.valid).length;
  console.log(`   ${validCount} variable(s) validated`);
}

/**
 * Get validation results without throwing (for diagnostics)
 */
export function getValidationResults(): ValidationResult[] {
  const results: ValidationResult[] = [];

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  results.push({
    name: 'SUPABASE_URL or VITE_SUPABASE_URL',
    valid: !!supabaseUrl && isValidUrl(supabaseUrl),
    error: !supabaseUrl ? 'Missing' : !isValidUrl(supabaseUrl) ? 'Invalid URL format' : undefined,
  });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  results.push({
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    valid: !!serviceRoleKey && isValidJWT(serviceRoleKey),
    error: !serviceRoleKey ? 'Missing' : !isValidJWT(serviceRoleKey) ? 'Invalid JWT format' : undefined,
  });

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  results.push({
    name: 'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY',
    valid: !!anonKey && isValidJWT(anonKey),
    error: !anonKey ? 'Missing' : !isValidJWT(anonKey) ? 'Invalid JWT format' : undefined,
  });

  return results;
}

