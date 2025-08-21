import { db } from '../db';
import { followUpActionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteFollowUpAction = async (id: number): Promise<boolean> => {
  try {
    // Delete the follow-up action with the specified ID
    const result = await db.delete(followUpActionsTable)
      .where(eq(followUpActionsTable.id, id))
      .execute();

    // Return true if a row was deleted, false if no matching record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Follow-up action deletion failed:', error);
    throw error;
  }
};