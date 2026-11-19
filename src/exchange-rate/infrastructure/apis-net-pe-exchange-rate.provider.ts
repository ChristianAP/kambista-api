import { ExchangeRateProvider, ExchangeRateQuote } from '../application/exchange-rate.provider';
import { ExchangeRateProviderError } from '../domain/exchange-rate.errors';

const REQUEST_TIMEOUT_MS = 5_000;

interface SunatPayload {
  compra: number;
  venta: number;
  origen: string;
  fecha: string;
}

export class ApisNetPeExchangeRateProvider implements ExchangeRateProvider {
  constructor(private readonly url: string) {}

  async fetchLatest(): Promise<ExchangeRateQuote> {
    const { compra, venta, origen, fecha } = await this.requestPayload();
    return { buy: compra, sell: venta, source: origen, quotedOn: fecha };
  }

  private async requestPayload(): Promise<SunatPayload> {
    try {
      const response = await fetch(this.url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

      if (!response.ok) {
        throw new Error(`respondió con el estado HTTP ${response.status}`);
      }

      return (await response.json()) as SunatPayload;
    } catch (error) {
      throw new ExchangeRateProviderError(error instanceof Error ? error.message : String(error));
    }
  }
}
