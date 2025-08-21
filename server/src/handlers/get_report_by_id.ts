import { db } from '../db';
import { reportsTable, followUpActionsTable } from '../db/schema';
import { type ReportWithFollowUps } from '../schema';
import { eq } from 'drizzle-orm';

export const getReportById = async (id: number): Promise<ReportWithFollowUps | null> => {
  try {
    // Query report with its follow-up actions using a join
    const results = await db.select()
      .from(reportsTable)
      .leftJoin(followUpActionsTable, eq(followUpActionsTable.report_id, reportsTable.id))
      .where(eq(reportsTable.id, id))
      .execute();

    // If no results, report doesn't exist
    if (results.length === 0) {
      return null;
    }

    // Get the report data from the first result
    const reportData = results[0].reports;

    // Collect all follow-up actions (filter out null entries from left join)
    const followUpActions = results
      .map(result => result.follow_up_actions)
      .filter(action => action !== null)
      .map(action => ({
        ...action!,
        due_date: action!.due_date || null,
        completion_date: action!.completion_date || null,
        assigned_to: action!.assigned_to || null,
        notes: action!.notes || null
      }));

    // Return report with follow-up actions
    return {
      ...reportData,
      description: reportData.description || null,
      file_url: reportData.file_url || null,
      file_name: reportData.file_name || null,
      follow_up_actions: followUpActions
    };
  } catch (error) {
    console.error('Failed to get report by id:', error);
    throw error;
  }
};