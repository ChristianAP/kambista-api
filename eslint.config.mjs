import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const libraries = [
  'express',
  'mongoose',
  'bcryptjs',
  'jsonwebtoken',
  'cors',
  'helmet',
  'zod',
  'dotenv',
  'swagger-ui-express',
];

const restrictImports = (outerLayers) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          regex: `(^|/)(${outerLayers.join('|')})(/|$)`,
          message: 'Una capa interna no puede depender de una capa externa.',
        },
        {
          group: libraries,
          message: 'Esta capa debe permanecer independiente de librerías de infraestructura.',
        },
      ],
    },
  ],
});

export default defineConfig(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['src/**/domain/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: restrictImports(['application', 'infrastructure', 'presentation']),
  },
  {
    files: ['src/**/application/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: restrictImports(['infrastructure', 'presentation']),
  },
);
