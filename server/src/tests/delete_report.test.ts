import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable, followUpActionsTable } from '../db/schema';
import { deleteReport } from '../handlers/delete_report';
import { eq } from 'drizzle-orm';

describe('deleteReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing report', async () => {
    // Create a test report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: 'Test Report',
        description: 'A test report',
        report_type: 'oversight',
        status: 'pending',
        uploaded_by: 'test_user'
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Delete the report
    const result = await deleteReport(reportId);

    expect(result).toBe(true);

    // Verify the report is deleted from database
    const reports = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, reportId))
      .execute();

    expect(reports).toHaveLength(0);
  });

  it('should return false for non-existent report', async () => {
    // Try to delete a report that doesn't exist
    const result = await deleteReport(99999);

    expect(result).toBe(false);
  });

  it('should cascade delete follow-up actions when deleting report', async () => {
    // Create a test report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: 'Report with Follow-ups',
        description: 'A test report with follow-up actions',
        report_type: 'audit',
        status: 'completed',
        uploaded_by: 'test_user'
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Create follow-up actions for this report
    await db.insert(followUpActionsTable)
      .values([
        {
          report_id: reportId,
          action_description: 'Follow up action 1',
          assigned_to: 'user1',
          status: 'not_started'
        },
        {
          report_id: reportId,
          action_description: 'Follow up action 2',
          assigned_to: 'user2',
          status: 'in_progress',
          due_date: new Date('2024-12-31')
        }
      ])
      .execute();

    // Verify follow-up actions exist before deletion
    const followUpsBefore = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.report_id, reportId))
      .execute();

    expect(followUpsBefore).toHaveLength(2);

    // Delete the report
    const result = await deleteReport(reportId);

    expect(result).toBe(true);

    // Verify the report is deleted
    const reports = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, reportId))
      .execute();

    expect(reports).toHaveLength(0);

    // Verify follow-up actions are cascade deleted
    const followUpsAfter = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.report_id, reportId))
      .execute();

    expect(followUpsAfter).toHaveLength(0);
  });

  it('should handle deletion of report with no follow-up actions', async () => {
    // Create a test report without follow-up actions
    const reportResult = await db.insert(reportsTable)
      .values({
        title: 'Simple Report',
        description: null,
        report_type: 'review',
        status: 'in_progress',
        file_url: 'https://example.com/report.pdf',
        file_name: 'report.pdf',
        uploaded_by: 'admin_user'
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Delete the report
    const result = await deleteReport(reportId);

    expect(result).toBe(true);

    // Verify the report is deleted
    const reports = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, reportId))
      .execute();

    expect(reports).toHaveLength(0);
  });

  it('should not affect other reports when deleting one', async () => {
    // Create multiple test reports
    const reportResults = await db.insert(reportsTable)
      .values([
        {
          title: 'Report 1',
          description: 'First report',
          report_type: 'oversight',
          status: 'pending',
          uploaded_by: 'user1'
        },
        {
          title: 'Report 2',
          description: 'Second report',
          report_type: 'audit',
          status: 'completed',
          uploaded_by: 'user2'
        }
      ])
      .returning()
      .execute();

    const reportId1 = reportResults[0].id;
    const reportId2 = reportResults[1].id;

    // Delete only the first report
    const result = await deleteReport(reportId1);

    expect(result).toBe(true);

    // Verify first report is deleted
    const deletedReports = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, reportId1))
      .execute();

    expect(deletedReports).toHaveLength(0);

    // Verify second report still exists
    const remainingReports = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, reportId2))
      .execute();

    expect(remainingReports).toHaveLength(1);
    expect(remainingReports[0].title).toBe('Report 2');
  });
});