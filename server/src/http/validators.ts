import { z } from 'zod';
import { TASK_STATUSES, type TaskStatus } from '../domain/status';
import { ACTOR_IDS } from '../domain/actors';

const actorSchema = z
  .string({ required_error: 'actor is required' })
  .refine((value) => ACTOR_IDS.includes(value), {
    message: `actor must be one of: ${ACTOR_IDS.join(', ')}`,
  });

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .trim()
    .min(1, 'title must not be empty')
    .max(200, 'title is too long (max 200 characters)'),
  actor: actorSchema,
});

export const updateStatusSchema = z.object({
  status: z.enum(TASK_STATUSES as unknown as [TaskStatus, ...TaskStatus[]], {
    errorMap: () => ({ message: `status must be one of: ${TASK_STATUSES.join(', ')}` }),
  }),
  actor: actorSchema,
});

export const deleteTaskSchema = z.object({
  actor: actorSchema,
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateStatusBody = z.infer<typeof updateStatusSchema>;
export type DeleteTaskBody = z.infer<typeof deleteTaskSchema>;
