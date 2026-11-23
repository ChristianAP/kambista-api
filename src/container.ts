import { Environment } from './config/environment';
import { ExchangeRateProvider } from './exchange-rate/application/exchange-rate.provider';
import { GetLatestExchangeRate } from './exchange-rate/application/get-latest-exchange-rate';
import { RefreshExchangeRate } from './exchange-rate/application/refresh-exchange-rate';
import { ApisNetPeExchangeRateProvider } from './exchange-rate/infrastructure/apis-net-pe-exchange-rate.provider';
import { ExchangeRateModel } from './exchange-rate/infrastructure/exchange-rate.model';
import { ExchangeRatePoller } from './exchange-rate/infrastructure/exchange-rate-poller';
import { MongoExchangeRateRepository } from './exchange-rate/infrastructure/mongo-exchange-rate.repository';
import { LoginUser } from './identity/application/login-user';
import { PromoteUserToAdmin } from './identity/application/promote-user-to-admin';
import { RegisterUser } from './identity/application/register-user';
import { BcryptPasswordHasher } from './identity/infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './identity/infrastructure/jwt-token-service';
import { MongoUserRepository } from './identity/infrastructure/mongo-user.repository';
import { UserModel } from './identity/infrastructure/user.model';
import { SystemClock } from './shared/infrastructure/system-clock';
import { createLogger } from './shared/infrastructure/logger';
import { UuidIdGenerator } from './shared/infrastructure/uuid-id-generator';
import { CreateTransaction } from './transactions/application/create-transaction';
import { GetTransactionHistory } from './transactions/application/get-transaction-history';
import { MongoTransactionRepository } from './transactions/infrastructure/mongo-transaction.repository';
import { TransactionModel } from './transactions/infrastructure/transaction.model';

export interface ContainerOverrides {
  exchangeRateProvider?: ExchangeRateProvider;
}

export const buildContainer = (config: Environment, overrides: ContainerOverrides = {}) => {
  const clock = new SystemClock();
  const ids = new UuidIdGenerator();
  const loggerFor = (context: string) => createLogger(context, config.LOG_LEVEL);

  const users = new MongoUserRepository(UserModel);
  const passwordHasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService(config.JWT_SECRET, config.JWT_EXPIRES_IN_SECONDS);

  const exchangeRates = new MongoExchangeRateRepository(ExchangeRateModel);
  const exchangeRateProvider =
    overrides.exchangeRateProvider ??
    new ApisNetPeExchangeRateProvider(config.EXCHANGE_RATE_API_URL);
  const refreshExchangeRate = new RefreshExchangeRate(
    exchangeRateProvider,
    exchangeRates,
    ids,
    clock,
  );
  const getLatestExchangeRate = new GetLatestExchangeRate(exchangeRates);

  const transactions = new MongoTransactionRepository(TransactionModel);

  return {
    tokens,
    loggerFor,
    registerUser: new RegisterUser(users, passwordHasher, ids, clock),
    loginUser: new LoginUser(users, passwordHasher, tokens),
    promoteUserToAdmin: new PromoteUserToAdmin(users),
    refreshExchangeRate,
    createTransaction: new CreateTransaction(getLatestExchangeRate, transactions, ids, clock),
    getTransactionHistory: new GetTransactionHistory(transactions),
    exchangeRatePoller: new ExchangeRatePoller(
      refreshExchangeRate,
      config.EXCHANGE_RATE_POLL_INTERVAL_MS,
      loggerFor('ExchangeRatePoller'),
    ),
  };
};

export type Container = ReturnType<typeof buildContainer>;
