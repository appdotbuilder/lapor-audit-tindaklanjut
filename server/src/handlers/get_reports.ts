import { db } from '../db';
import { reportsTable } from '../db/schema';
import { type GetReportsInput, type Report } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getReports(input?: GetReportsInput): Promise<Report[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input) {
      if (input.report_type) {
        conditions.push(eq(reportsTable.report_type, input.report_type));
      }

      if (input.status) {
        conditions.push(eq(reportsTable.status, input.status));
      }

      if (input.uploaded_by) {
        conditions.push(eq(reportsTable.uploaded_by, input.uploaded_by));
      }
    }

    // Build query with conditional where clause
    const query = conditions.length > 0
      ? db.select().from(reportsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(reportsTable);

    // Execute query and return results
    const results = await query.execute();
    return results;
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    throw error;
  }
}