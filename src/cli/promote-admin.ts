import { loadEnvironmentFromFile } from '../config/load-environment-file';
import { buildContainer } from '../container';
import { connectDatabase, disconnectDatabase } from '../database/connection';

async function promoteAdmin(email: string | undefined): Promise<void> {
  if (!email) {
    throw new Error('Uso: npm run admin:promote -- <correo-del-usuario>');
  }

  const config = loadEnvironmentFromFile();
  await connectDatabase(config.MONGODB_URI);

  try {
    const user = await buildContainer(config).promoteUserToAdmin.execute(email);
    console.log(`El usuario ${user.email.value} ahora tiene el rol ${user.role}`);
  } finally {
    await disconnectDatabase();
  }
}

promoteAdmin(process.argv[2]).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
