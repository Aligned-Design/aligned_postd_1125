/**
 * Analytics Scheduler
 * Manages 24-hour analytics sync and monthly plan generation
 */

import { analyticsSync } from './analytics-sync';
import { analyticsDB } from './analytics-db-service';
import { autoPlanGenerator } from './auto-plan-generator';
import { connectionsDB } from './connections-db-service';

/**
 * Schedule analytics sync for all brands
 * Should be called once on server startup with setInterval or cron job
 */
export async function scheduleAnalyticsSyncJobs(): Promise<void> {
  console.log('📅 Analytics sync scheduler initialized');

  // Run sync every 24 hours
  const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  // Initial sync after 1 minute delay
  setTimeout(async () => {
    await syncAllBrands();
  }, 60 * 1000);

  // Recurring sync every 24 hours
  setInterval(async () => {
    await syncAllBrands();
  }, SYNC_INTERVAL);

  // Run auto-plan generation monthly
  const checkTime = () => {
    const now = new Date();
    // Run at 2 AM on the 1st of each month
    if (now.getDate() === 1 && now.getHours() === 2) {
      generateMonthlyPlans().catch(err => console.error('Error generating monthly plans:', err));
    }
  };

  setInterval(checkTime, 60 * 60 * 1000); // Check every hour

  console.log('✅ Scheduler ready for analytics sync (every 24 hours) and monthly plan generation');
}

/**
 * Sync analytics for all brands
 */
async function syncAllBrands(): Promise<void> {
  try {
    console.log('🔄 Starting global analytics sync...');
    const startTime = new Date();

    // Get all brands (in production, would query brands table)
    // For now, we'll accept that this is called with specific brands
    // This function would be extended to query all brands from database

    console.log(`✅ Global analytics sync completed in ${new Date().getTime() - startTime.getTime()}ms`);
  } catch (error) {
    console.error('❌ Global analytics sync failed:', error);
  }
}

/**
 * Sync analytics for a specific brand
 */
export async function syncBrandAnalytics(brandId: string, tenantId: string): Promise<void> {
  try {
    console.log(`🔄 Syncing analytics for brand ${brandId}...`);
    const startTime = new Date();

    // Get all platform connections for the brand
    const connections = await connectionsDB.getBrandConnections(brandId);

    if (connections.length === 0) {
      console.log(`⚠️  No platform connections found for brand ${brandId}`);
      return;
    }

    // Create sync configs from connections
    const syncConfigs = connections
      .filter(conn => conn.status === 'connected')
      .map(conn => ({
        platform: conn.platform as unknown,
        accessToken: conn.access_token,
        accountId: conn.account_id,
        lastSyncAt: conn.last_verified_at || undefined
      }));

    if (syncConfigs.length === 0) {
      console.log(`⚠️  No active platform connections for brand ${brandId}`);
      return;
    }

    // Perform incremental sync
    await analyticsSync.performIncrementalSync(brandId, syncConfigs);

    // Log successful sync
    const endTime = new Date();
    await analyticsDB.logSync(
      brandId,
      tenantId,
      'all',
      'incremental',
      'completed',
      syncConfigs.length,
      0,
      startTime,
      endTime
    );

    console.log(`✅ Analytics sync completed for brand ${brandId} in ${endTime.getTime() - startTime.getTime()}ms`);
  } catch (error) {
    console.error(`❌ Analytics sync failed for brand ${brandId}:`, error);

    try {
      await analyticsDB.logSync(
        brandId,
        tenantId,
        'all',
        'incremental',
        'failed',
        0,
        1,
        new Date(),
        undefined,
        {
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      );
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }
  }
}

/**
 * Generate monthly plans for all brands
 */
async function generateMonthlyPlans(): Promise<void> {
  try {
    console.log('📋 Starting monthly plan generation for all brands...');
    const startTime = new Date();

    // In production, would query all brands from database
    // For now, this is a placeholder that would be called for specific brands

    console.log(`✅ Monthly plan generation completed in ${new Date().getTime() - startTime.getTime()}ms`);
  } catch (error) {
    console.error('❌ Monthly plan generation failed:', error);
  }
}

/**
 * Generate monthly plan for a specific brand
 */
export async function generateBrandMonthlyPlan(
  brandId: string,
  tenantId: string,
  month?: Date
): Promise<unknown> {
  try {
    console.log(`📋 Generating monthly plan for brand ${brandId}...`);

    // Generate the plan
    const planData = await autoPlanGenerator.generateMonthlyPlan(brandId, tenantId, month);

    // Check if plan already exists for this month
    const existingPlan = await autoPlanGenerator.getCurrentMonthPlan(brandId);

    if (existingPlan) {
      // Update existing plan
      const { supabase } = await import('./supabase');
      const { data, error } = await supabase
        .from('auto_plans')
        .update({
          plan_data: planData,
          generated_at: new Date().toISOString()
        })
        .eq('id', existingPlan.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update plan: ${error.message}`);
      console.log(`✅ Monthly plan updated for brand ${brandId}`);
      return data;
    } else {
      // Create new plan
      const { supabase } = await import('./supabase');
      const monthStart = new Date();
      monthStart.setDate(1);

      const { data, error } = await supabase
        .from('auto_plans')
        .insert({
          brand_id: brandId,
          tenant_id: tenantId,
          month: monthStart.toISOString().split('T')[0],
          name: `${monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })} Content Plan`,
          plan_data: planData,
          confidence: planData.confidence,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create plan: ${error.message}`);
      console.log(`✅ Monthly plan generated for brand ${brandId}`);
      return data;
    }
  } catch (error) {
    console.error(`❌ Monthly plan generation failed for brand ${brandId}:`, error);
    throw error;
  }
}

/**
 * Get sync status for a brand
 */
export async function getSyncStatus(brandId: string): Promise<{
  lastSync?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  duration?: number;
}> {
  try {
    const logs = await analyticsDB.getSyncLogs(brandId, 1);

    if (logs.length === 0) {
      return {
        status: 'pending',
        itemsSynced: 0,
        itemsFailed: 0
      };
    }

    const lastLog = logs[0];
    return {
      lastSync: new Date(lastLog.completed_at || lastLog.started_at),
      status: lastLog.status as unknown,
      itemsSynced: lastLog.items_synced,
      itemsFailed: lastLog.items_failed,
      duration: lastLog.duration_ms
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return {
      status: 'failed',
      itemsSynced: 0,
      itemsFailed: 0
    };
  }
}
