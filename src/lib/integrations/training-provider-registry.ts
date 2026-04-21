import type { TrainingProviderAdapter } from "@/lib/training/types";
import { VthTrainingProvider } from "@/lib/integrations/providers/vth-provider";

class TrainingProviderRegistry {
  private readonly providers = new Map<string, TrainingProviderAdapter>();

  register(provider: TrainingProviderAdapter): void {
    this.providers.set(provider.providerCode, provider);
  }

  get(providerCode: string): TrainingProviderAdapter | undefined {
    return this.providers.get(providerCode);
  }

  list(): TrainingProviderAdapter[] {
    return Array.from(this.providers.values());
  }
}

export const trainingProviderRegistry = new TrainingProviderRegistry();

trainingProviderRegistry.register(new VthTrainingProvider());
