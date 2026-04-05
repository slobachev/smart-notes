import z from 'zod';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Minimum 8 characters'),
  name: z.string().min(1).optional(),
});
