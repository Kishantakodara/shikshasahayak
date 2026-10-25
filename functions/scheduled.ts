// ============================================================
// CLOUDFLARE WORKERS SCHEDULED CRON EVENT HANDLER
// Triggered daily at 2:00 AM UTC via wrangler.toml [triggers] crons
// Runs automated GTU discovery, pipeline recovery, & quality checks.
// ============================================================

import { runScheduledPipelineTrigger } from './lib/questionIntelligence/pipelineOrchestrator';

export async function onScheduled(event: { cron: string; scheduledTime: number }, env: any, ctx: any): Promise<void> {
  console.log(`[CRON] Scheduled event triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);

  try {
    ctx.waitUntil(
      (async () => {
        const result = await runScheduledPipelineTrigger(env);
        console.log(`[CRON] Scheduled pipeline trigger completed: ${result.gtuJob.job_id} at ${result.timestamp}`);
      })()
    );
  } catch (err: any) {
    console.error(`[CRON] Scheduled pipeline execution failed:`, err);
  }
}
