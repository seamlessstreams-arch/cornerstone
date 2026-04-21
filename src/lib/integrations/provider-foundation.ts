import { z } from "zod";

export const providerConnectionSchema = z.object({
  provider_code: z.string().min(2),
  organisation_id: z.string().uuid(),
  home_id: z.string().uuid().nullable(),
  config: z.record(z.string(), z.unknown()),
  credentials_ref: z.string().min(6),
});

export type ProviderConnectionInput = z.infer<typeof providerConnectionSchema>;

export interface ProviderSyncResult {
  ok: boolean;
  recordsProcessed: number;
  warnings: string[];
}

export interface IntegrationProvider {
  providerCode: string;
  displayName: string;
  sync(connection: ProviderConnectionInput): Promise<ProviderSyncResult>;
}

export class ProviderRegistry {
  private providers = new Map<string, IntegrationProvider>();

  register(provider: IntegrationProvider): void {
    this.providers.set(provider.providerCode, provider);
  }

  get(providerCode: string): IntegrationProvider | undefined {
    return this.providers.get(providerCode);
  }
}

export const providerRegistry = new ProviderRegistry();
