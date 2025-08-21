import { db } from '../db';
import { reportsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteReport(id: number): Promise<boolean> {
  try {
    // First check if the report exists
    const existingReport = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, id))
      .execute();

    if (existingReport.length === 0) {
      return false; // Report not found
    }

    // Delete the report (cascade delete will handle follow-up actions)
    const result = await db.delete(reportsTable)
      .where(eq(reportsTable.id, id))
      .execute();

    return true; // Successfully deleted
  } catch (error) {
    console.error('Report deletion failed:', error);
    throw error;
  }
}