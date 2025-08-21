import { db } from '../db';
import { reportsTable } from '../db/schema';
import { type CreateReportInput, type Report } from '../schema';

export const createReport = async (input: CreateReportInput): Promise<Report> => {
  try {
    // Insert report record
    const result = await db.insert(reportsTable)
      .values({
        title: input.title,
        description: input.description,
        report_type: input.report_type,
        file_url: input.file_url,
        file_name: input.file_name,
        uploaded_by: input.uploaded_by,
        // status defaults to 'pending' in schema
        // created_at and updated_at default to now() in schema
      })
      .returning()
      .execute();

    const report = result[0];
    return report;
  } catch (error) {
    console.error('Report creation failed:', error);
    throw error;
  }
};