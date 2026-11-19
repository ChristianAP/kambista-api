import mongoose from 'mongoose';

const CONNECTED = 1;

export const connectDatabase = async (uri: string): Promise<void> => {
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
};

export const disconnectDatabase = (): Promise<void> => mongoose.disconnect();

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === CONNECTED;
