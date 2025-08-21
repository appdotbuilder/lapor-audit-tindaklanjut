import { z } from 'zod';

// Report type enum
export const reportTypeSchema = z.enum(['oversight', 'audit', 'review']);
export type ReportType = z.infer<typeof reportTypeSchema>;

// Report status enum
export const reportStatusSchema = z.enum(['pending', 'in_progress', 'completed']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

// Follow-up status enum
export const followUpStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);
export type FollowUpStatus = z.infer<typeof followUpStatusSchema>;

// Report schema
export const reportSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  report_type: reportTypeSchema,
  status: reportStatusSchema,
  file_url: z.string().nullable(),
  file_name: z.string().nullable(),
  uploaded_by: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Report = z.infer<typeof reportSchema>;

// Follow-up action schema
export const followUpActionSchema = z.object({
  id: z.number(),
  report_id: z.number(),
  action_description: z.string(),
  assigned_to: z.string().nullable(),
  status: followUpStatusSchema,
  due_date: z.coerce.date().nullable(),
  completion_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FollowUpAction = z.infer<typeof followUpActionSchema>;

// Input schema for creating reports
export const createReportInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  report_type: reportTypeSchema,
  file_url: z.string().nullable(),
  file_name: z.string().nullable(),
  uploaded_by: z.string().min(1, 'Uploader name is required')
});

export type CreateReportInput = z.infer<typeof createReportInputSchema>;

// Input schema for updating reports
export const updateReportInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  report_type: reportTypeSchema.optional(),
  status: reportStatusSchema.optional(),
  file_url: z.string().nullable().optional(),
  file_name: z.string().nullable().optional()
});

export type UpdateReportInput = z.infer<typeof updateReportInputSchema>;

// Input schema for creating follow-up actions
export const createFollowUpActionInputSchema = z.object({
  report_id: z.number(),
  action_description: z.string().min(1, 'Action description is required'),
  assigned_to: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  notes: z.string().nullable()
});

export type CreateFollowUpActionInput = z.infer<typeof createFollowUpActionInputSchema>;

// Input schema for updating follow-up actions
export const updateFollowUpActionInputSchema = z.object({
  id: z.number(),
  action_description: z.string().min(1, 'Action description is required').optional(),
  assigned_to: z.string().nullable().optional(),
  status: followUpStatusSchema.optional(),
  due_date: z.coerce.date().nullable().optional(),
  completion_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateFollowUpActionInput = z.infer<typeof updateFollowUpActionInputSchema>;

// Query schema for filtering reports
export const getReportsInputSchema = z.object({
  report_type: reportTypeSchema.optional(),
  status: reportStatusSchema.optional(),
  uploaded_by: z.string().optional()
});

export type GetReportsInput = z.infer<typeof getReportsInputSchema>;

// Schema for report with follow-up actions
export const reportWithFollowUpsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  report_type: reportTypeSchema,
  status: reportStatusSchema,
  file_url: z.string().nullable(),
  file_name: z.string().nullable(),
  uploaded_by: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  follow_up_actions: z.array(followUpActionSchema)
});

export type ReportWithFollowUps = z.infer<typeof reportWithFollowUpsSchema>;