import { db } from '../db';
import { followUpActionsTable } from '../db/schema';
import { type FollowUpAction } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function getFollowUpActionsByReportId(reportId: number): Promise<FollowUpAction[]> {
  try {
    const results = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.report_id, reportId))
      .orderBy(followUpActionsTable.created_at)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch follow-up actions by report ID:', error);
    throw error;
  }
}

export async function getPendingFollowUpActions(): Promise<FollowUpAction[]> {
  try {
    const results = await db.select()
      .from(followUpActionsTable)
      .where(or(
        eq(followUpActionsTable.status, 'not_started'),
        eq(followUpActionsTable.status, 'in_progress')
      ))
      .orderBy(followUpActionsTable.due_date)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch pending follow-up actions:', error);
    throw error;
  }
}