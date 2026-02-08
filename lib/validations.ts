import { z } from 'zod'

// Project schemas
export const projectStatusSchema = z.enum(['idea', 'active', 'paused', 'shipped'])
export const projectSourceSchema = z.enum(['davidai', 'github']).nullable()

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  status: projectStatusSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  external_source: projectSourceSchema,
  external_id: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: projectStatusSchema.optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  external_source: projectSourceSchema.optional(),
  external_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

// Task schemas
export const taskStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'review', 'done'])
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
export const ownerTypeSchema = z.enum(['human', 'agent'])

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  project_id: z.string().uuid().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  owner: z.string().min(1).max(100),
  owner_type: ownerTypeSchema,
  agent_metadata: z.record(z.any()).nullable(),
  tags: z.array(z.string()).nullable(),
  due_date: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  project_id: z.string().uuid().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  owner: z.string().min(1).max(100),
  owner_type: ownerTypeSchema,
  agent_metadata: z.object({
    model: z.string().optional(),
    iterations: z.number().optional(),
    tokens: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  due_date: z.string().datetime().optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

// Idea schemas
export const ideaCategorySchema = z.enum(['product', 'tool', 'business', 'research'])
export const ideaStatusSchema = z.enum(['brainstorm', 'research', 'in_progress', 'shipped'])

export const ideaSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  category: ideaCategorySchema.nullable(),
  status: ideaStatusSchema,
  owner: z.string().min(1).max(100),
  owner_type: ownerTypeSchema,
  metadata: z.record(z.any()).nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const createIdeaSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  category: ideaCategorySchema.optional(),
  status: ideaStatusSchema.optional(),
  owner: z.string().min(1).max(100).default('David'),
  owner_type: ownerTypeSchema.default('human'),
  metadata: z.record(z.any()).optional(),
})

export const updateIdeaSchema = createIdeaSchema.partial()

// Reading list schemas
export const readingListSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  created_at: z.date(),
})

export const createReadingListSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
})

export const updateReadingListSchema = createReadingListSchema.partial()

// Article schemas
export const articleStatusSchema = z.enum(['unread', 'reading', 'read', 'archived'])

export const articleSchema = z.object({
  id: z.string().uuid(),
  reading_list_id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().nullable(),
  author: z.string().nullable(),
  status: articleStatusSchema,
  notes: z.string().nullable(),
  added_at: z.date(),
  read_at: z.date().nullable(),
})

export const createArticleSchema = z.object({
  reading_list_id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().optional(),
  author: z.string().optional(),
  status: articleStatusSchema.optional(),
  notes: z.string().optional(),
})

export const updateArticleSchema = createArticleSchema.partial().omit({ reading_list_id: true })

// Activity log schemas
export const activityEntityTypeSchema = z.enum(['task', 'project', 'idea', 'article'])
export const activityActionSchema = z.enum(['created', 'updated', 'completed', 'moved', 'deleted'])

export const activityLogSchema = z.object({
  id: z.string().uuid(),
  entity_type: activityEntityTypeSchema,
  entity_id: z.string().uuid(),
  action: activityActionSchema,
  actor: z.string().min(1).max(100),
  actor_type: ownerTypeSchema,
  changes: z.record(z.any()).nullable(),
  timestamp: z.date(),
})

export const createActivityLogSchema = z.object({
  entity_type: activityEntityTypeSchema,
  entity_id: z.string().uuid(),
  action: activityActionSchema,
  actor: z.string().min(1).max(100),
  actor_type: ownerTypeSchema,
  changes: z.record(z.any()).optional(),
})

// Type exports
export type Project = z.infer<typeof projectSchema>
export type CreateProject = z.infer<typeof createProjectSchema>
export type UpdateProject = z.infer<typeof updateProjectSchema>

export type Task = z.infer<typeof taskSchema>
export type CreateTask = z.infer<typeof createTaskSchema>
export type UpdateTask = z.infer<typeof updateTaskSchema>

export type Idea = z.infer<typeof ideaSchema>
export type CreateIdea = z.infer<typeof createIdeaSchema>
export type UpdateIdea = z.infer<typeof updateIdeaSchema>

export type ReadingList = z.infer<typeof readingListSchema>
export type CreateReadingList = z.infer<typeof createReadingListSchema>
export type UpdateReadingList = z.infer<typeof updateReadingListSchema>

export type Article = z.infer<typeof articleSchema>
export type CreateArticle = z.infer<typeof createArticleSchema>
export type UpdateArticle = z.infer<typeof updateArticleSchema>

export type ActivityLog = z.infer<typeof activityLogSchema>
export type CreateActivityLog = z.infer<typeof createActivityLogSchema>
