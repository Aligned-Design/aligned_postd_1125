/**
 * Check Brand Scrape Status
 * 
 * Verifies that brands.scraper_status and brands.scraped_at are correctly set
 * after a crawl completes.
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/check-brand-scrape-status.mjs <BRAND_ID>
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nsrlgwimixkgwlqrpbxq.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const brandId = process.argv[2]

if (!brandId) {
  console.error('❌ Usage: node scripts/check-brand-scrape-status.mjs <BRAND_ID>')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('═══════════════════════════════════════')
console.log('Brand Scrape Status Verification')
console.log('═══════════════════════════════════════\n')
console.log('Brand ID:', brandId)
console.log('')

// Check brand status  
const { data: brand, error: brandError } = await supabase
  .from('brands')
  .select('id, name, scraper_status, scraped_at, website_url, updated_at')
  .eq('id', brandId)
  .single()

if (brandError) {
  console.error('❌ Error fetching brand:', brandError.message)
  process.exit(1)
}

if (!brand) {
  console.error('❌ Brand not found')
  process.exit(1)
}

console.log('🏢 Brand Info:')
console.log(`   Name: ${brand.name}`)
console.log(`   Website: ${brand.website_url}`)
console.log('')

console.log('📊 Crawl Status:')
console.log(`   Scraper Status: ${brand.scraper_status || 'null'}`)
console.log(`   Scraped At: ${brand.scraped_at || 'null'}`)
console.log(`   Updated At: ${brand.updated_at || 'null'}`)
console.log('')

// Check media_assets count
const { data: assets, error: assetsError, count } = await supabase
  .from('media_assets')
  .select('id, category, filename', { count: 'exact' })
  .eq('brand_id', brandId)

if (assetsError) {
  console.error('❌ Error querying media_assets:', assetsError.message)
} else {
  console.log(`📁 Media Assets: ${count || 0}`)
  if (assets && assets.length > 0) {
    console.log('\nSample Assets:')
    assets.slice(0, 3).forEach((asset, i) => {
      console.log(`  ${i + 1}. ${asset.filename} (${asset.category})`)
    })
  }
}

console.log('\n═══════════════════════════════════════')

// Interpretation
console.log('\n💡 Interpretation:')
if (brand.scraper_status === 'never_run' || brand.scraper_status === null) {
  console.log('   ⚠️  Crawler has never run for this brand')
} else if (brand.scraper_status === 'ok') {
  if (count && count > 0) {
    console.log(`   ✅ Crawler completed successfully with ${count} assets`)
  } else {
    console.log('   ✅ Crawler completed successfully but found 0 assets')
    console.log('      (This is expected for sites like example.com)')
  }
} else if (brand.scraper_status === 'error' || brand.scraper_status === 'fail') {
  console.log('   ❌ Crawler failed during execution')
} else if (brand.scraper_status === 'running') {
  console.log('   ⏳ Crawler is currently running')
} else {
  console.log(`   ❓ Unknown status: ${brand.scraper_status}`)
}

console.log('\n')

