import { db } from '../db';
import { followUpActionsTable } from '../db/schema';
import { type UpdateFollowUpActionInput, type FollowUpAction } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateFollowUpAction(input: UpdateFollowUpActionInput): Promise<FollowUpAction | null> {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.action_description !== undefined) {
      updateData.action_description = input.action_description;
    }

    if (input.assigned_to !== undefined) {
      updateData.assigned_to = input.assigned_to;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date;
    }

    if (input.completion_date !== undefined) {
      updateData.completion_date = input.completion_date;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Override completion_date if status is being set to 'completed' (after other fields are set)
    if (input.status === 'completed') {
      updateData.completion_date = new Date();
    }

    // Update the follow-up action
    const result = await db.update(followUpActionsTable)
      .set(updateData)
      .where(eq(followUpActionsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated follow-up action or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Follow-up action update failed:', error);
    throw error;
  }
}