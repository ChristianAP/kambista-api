import { Logger } from '../../shared/infrastructure/logger';
import { RefreshExchangeRate } from '../application/refresh-exchange-rate';

export class ExchangeRatePoller {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly refreshExchangeRate: RefreshExchangeRate,
    private readonly intervalMs: number,
    private readonly logger: Logger,
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.scheduleNext(0);
  }

  stop(): void {
    this.running = false;
    clearTimeout(this.timer);
  }

  private scheduleNext(delayMs: number): void {
    this.timer = setTimeout(() => void this.tick(), delayMs);
  }

  private async tick(): Promise<void> {
    await this.refresh();

    if (this.running) {
      this.scheduleNext(this.intervalMs);
    }
  }

  private async refresh(): Promise<void> {
    try {
      const rate = await this.refreshExchangeRate.execute();
      this.logger.info(`Tipo de cambio actualizado: compra ${rate.buy} / venta ${rate.sell}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo actualizar el tipo de cambio: ${reason}`);
    }
  }
}
