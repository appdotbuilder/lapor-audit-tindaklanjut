import { db } from '../db';
import { reportsTable } from '../db/schema';
import { type UpdateReportInput, type Report } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateReport(input: UpdateReportInput): Promise<Report | null> {
  try {
    const { id, ...updateFields } = input;

    // Check if report exists first
    const existingReport = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, id))
      .execute();

    if (existingReport.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (updateFields.title !== undefined) {
      updateData.title = updateFields.title;
    }
    if (updateFields.description !== undefined) {
      updateData.description = updateFields.description;
    }
    if (updateFields.report_type !== undefined) {
      updateData.report_type = updateFields.report_type;
    }
    if (updateFields.status !== undefined) {
      updateData.status = updateFields.status;
    }
    if (updateFields.file_url !== undefined) {
      updateData.file_url = updateFields.file_url;
    }
    if (updateFields.file_name !== undefined) {
      updateData.file_name = updateFields.file_name;
    }

    // Update the report
    const result = await db.update(reportsTable)
      .set(updateData)
      .where(eq(reportsTable.id, id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Report update failed:', error);
    throw error;
  }
}