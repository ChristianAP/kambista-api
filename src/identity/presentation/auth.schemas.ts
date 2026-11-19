import { z } from 'zod';
import { Role } from '../../shared/domain/role';

const OBJECT_MESSAGE = 'El cuerpo de la solicitud debe ser un objeto JSON';

const emailField = z
  .email('email debe ser un correo electrónico válido')
  .meta({ examples: ['juan@example.com'] });

export const registerBody = z.object(
  {
    nombre: z
      .string('nombre es obligatorio')
      .trim()
      .min(2, 'nombre debe tener al menos 2 caracteres')
      .max(100, 'nombre no puede superar los 100 caracteres')
      .meta({ examples: ['Juan Pérez'] }),
    email: emailField,
    password: z
      .string('password es obligatorio')
      .min(8, 'password debe tener al menos 8 caracteres')
      .max(72, 'password no puede superar los 72 caracteres')
      .meta({ examples: ['contraseña123'] }),
  },
  OBJECT_MESSAGE,
);

export const loginBody = z.object(
  {
    email: emailField,
    password: z.string('password es obligatorio').meta({ examples: ['contraseña123'] }),
  },
  OBJECT_MESSAGE,
);

export const userResponse = z.object({
  id: z.string().meta({ examples: ['0f8fad5b-d9cb-469f-a165-70867728950e'] }),
  nombre: z.string().meta({ examples: ['Juan Pérez'] }),
  email: z.string().meta({ examples: ['juan@example.com'] }),
  rol: z.enum(Role),
});

export const loginResponse = z.object({
  access_token: z.string().meta({ examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'] }),
  usuario: userResponse,
});

export type UserResponse = z.infer<typeof userResponse>;
export type LoginResponse = z.infer<typeof loginResponse>;
