import { db } from '../db';
import { followUpActionsTable, reportsTable } from '../db/schema';
import { type CreateFollowUpActionInput, type FollowUpAction } from '../schema';
import { eq } from 'drizzle-orm';

export async function createFollowUpAction(input: CreateFollowUpActionInput): Promise<FollowUpAction> {
  try {
    // Validate that the report exists
    const existingReport = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, input.report_id))
      .execute();

    if (existingReport.length === 0) {
      throw new Error(`Report with ID ${input.report_id} not found`);
    }

    // Insert follow-up action record
    const result = await db.insert(followUpActionsTable)
      .values({
        report_id: input.report_id,
        action_description: input.action_description,
        assigned_to: input.assigned_to,
        due_date: input.due_date,
        notes: input.notes
        // status defaults to 'not_started' in schema
        // completion_date is null by default
        // created_at and updated_at are set automatically
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Follow-up action creation failed:', error);
    throw error;
  }
}