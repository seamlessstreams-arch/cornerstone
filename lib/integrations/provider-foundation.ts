import { z } from 'zod'

export const providerConfigSchema = z.object({
  providerKey: z.string().min(2),
  organisationId: z.string().uuid(),
  connectionLabel: z.string().min(2),
  scopes: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export type ProviderConfigInput = z.infer<typeof providerConfigSchema>

export function buildProviderSyncEnvelope(input: {
  providerKey: string
  connectionId: string
  eventType: string
  payload: Record<string, unknown>
}) {
  return {
    provider_key: input.providerKey,
    connection_id: input.connectionId,
    event_type: input.eventType,
    payload: input.payload,
    emitted_at: new Date().toISOString()
  }
}
