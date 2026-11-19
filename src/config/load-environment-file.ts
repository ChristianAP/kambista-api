import { config } from 'dotenv';
import { Environment, loadEnvironment } from './environment';

export const loadEnvironmentFromFile = (): Environment => {
  config({ quiet: true });
  return loadEnvironment();
};
