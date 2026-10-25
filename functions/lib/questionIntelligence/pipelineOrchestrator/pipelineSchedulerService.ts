// ============================================================
// PIPELINE ORCHESTRATOR - SCHEDULER SERVICE
// Scheduled trigger integration for automated discovery & processing.
// ============================================================

import { Env } from '../../contentEngine';
import { startPipelineJob } from './pipelineOrchestratorService';
import { PipelineJobRecord } from './pipelineJobService';

export async function runScheduledPipelineTrigger(env: Env): Promise<{
  gtuJob: PipelineJobRecord;
  timestamp: string;
}> {
  const gtuJob = await startPipelineJob(env, {
    sourceType: 'GTU',
    requestedScope: 'FULL',
    createdBy: 'scheduler_cron',
    metadata: { trigger: 'scheduled_cron' },
  });

  return {
    gtuJob,
    timestamp: new Date().toISOString(),
  };
}
