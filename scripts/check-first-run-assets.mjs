import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nsrlgwimixkgwlqrpbxq.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const brandId = 'e6cf2c9a-3b2b-4907-8fbc-6457dd3270fe'

console.log('═══════════════════════════════════════')
console.log('First-Run Crawler Database Verification')
console.log('═══════════════════════════════════════\n')
console.log('Brand ID:', brandId)
console.log('')

// Check media_assets (using correct column names: category, path, filename)
const { data: assets, error, count } = await supabase
  .from('media_assets')
  .select('id, brand_id, category, filename, path, metadata', { count: 'exact' })
  .eq('brand_id', brandId)

if (error) {
  console.error('❌ Error querying media_assets:', error.message)
} else {
  console.log(`📊 Media Assets Count: ${count || 0}`)
  if (assets && assets.length > 0) {
    console.log('\n✅ Sample Assets:')
    assets.slice(0, 3).forEach((asset, i) => {
      console.log(`\n  ${i + 1}. ${asset.id}`)
      console.log(`     Category: ${asset.category}`)
      console.log(`     Filename: ${asset.filename}`)
      console.log(`     Path: ${asset.path}`)
    })
  } else {
    console.log('⚠️  No assets found - crawler may still be running or failed to persist')
  }
}

// Check brand status  
console.log('\n')
const { data: brand } = await supabase
  .from('brands')
  .select('id, name, scraper_status, scraped_at, website_url')
  .eq('id', brandId)
  .single()

if (brand) {
  console.log('🏢 Brand Status:')
  console.log(`   Name: ${brand.name}`)
  console.log(`   Website: ${brand.website_url}`)
  console.log(`   Scraper Status: ${brand.scraper_status || 'N/A'}`)
  console.log(`   Scraped At: ${brand.scraped_at || 'Never'}`)
}

console.log('\n═══════════════════════════════════════\n')

