import { serial, text, pgTable, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums for report types and statuses
export const reportTypeEnum = pgEnum('report_type', ['oversight', 'audit', 'review']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'in_progress', 'completed']);
export const followUpStatusEnum = pgEnum('follow_up_status', ['not_started', 'in_progress', 'completed']);

// Reports table
export const reportsTable = pgTable('reports', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  report_type: reportTypeEnum('report_type').notNull(),
  status: reportStatusEnum('status').notNull().default('pending'),
  file_url: text('file_url'), // Nullable - URL to uploaded file
  file_name: text('file_name'), // Nullable - original file name
  uploaded_by: text('uploaded_by').notNull(), // User who uploaded the report
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Follow-up actions table
export const followUpActionsTable = pgTable('follow_up_actions', {
  id: serial('id').primaryKey(),
  report_id: integer('report_id').notNull().references(() => reportsTable.id, { onDelete: 'cascade' }),
  action_description: text('action_description').notNull(),
  assigned_to: text('assigned_to'), // Nullable - person assigned to handle the action
  status: followUpStatusEnum('status').notNull().default('not_started'),
  due_date: timestamp('due_date'), // Nullable - when action should be completed
  completion_date: timestamp('completion_date'), // Nullable - when action was actually completed
  notes: text('notes'), // Nullable - additional notes about the action
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const reportsRelations = relations(reportsTable, ({ many }) => ({
  followUpActions: many(followUpActionsTable),
}));

export const followUpActionsRelations = relations(followUpActionsTable, ({ one }) => ({
  report: one(reportsTable, {
    fields: [followUpActionsTable.report_id],
    references: [reportsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Report = typeof reportsTable.$inferSelect;
export type NewReport = typeof reportsTable.$inferInsert;
export type FollowUpAction = typeof followUpActionsTable.$inferSelect;
export type NewFollowUpAction = typeof followUpActionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  reports: reportsTable, 
  followUpActions: followUpActionsTable 
};