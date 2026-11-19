export interface ExchangeRateQuote {
  readonly buy: number;
  readonly sell: number;
  readonly source: string;
  readonly quotedOn: string;
}

export abstract class ExchangeRateProvider {
  abstract fetchLatest(): Promise<ExchangeRateQuote>;
}
