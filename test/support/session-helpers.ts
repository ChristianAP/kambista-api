import { TestContext } from './create-test-app';

export const PASSWORD = 'contraseña123';

export interface Session {
  readonly email: string;
  readonly userId: string;
  readonly token: string;
}

let sequence = 0;

export const uniqueEmail = (): string => {
  sequence += 1;
  return `user-${sequence}-${Date.now()}@example.com`;
};

export const bearer = (session: Session): [string, string] => [
  'Authorization',
  `Bearer ${session.token}`,
];

export const logIn = async ({ http }: TestContext, email: string): Promise<Session> => {
  const { body } = await http
    .post('/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return { email, userId: body.usuario.id, token: body.access_token };
};

export const registerUser = async (
  context: TestContext,
  email: string = uniqueEmail(),
): Promise<Session> => {
  await context.http
    .post('/v1/auth/register')
    .send({ nombre: 'Juan Pérez', email, password: PASSWORD })
    .expect(201);
  return logIn(context, email);
};

export const registerAdmin = async (context: TestContext): Promise<Session> => {
  const { email } = await registerUser(context);
  await context.container.promoteUserToAdmin.execute(email);
  return logIn(context, email);
};

export const todayInLima = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
