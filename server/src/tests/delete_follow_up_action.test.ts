import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable, followUpActionsTable } from '../db/schema';
import { type CreateReportInput, type CreateFollowUpActionInput } from '../schema';
import { deleteFollowUpAction } from '../handlers/delete_follow_up_action';
import { eq } from 'drizzle-orm';

// Test data
const testReportInput: CreateReportInput = {
  title: 'Test Report for Follow-up Deletion',
  description: 'A report for testing follow-up action deletion',
  report_type: 'audit',
  file_url: 'https://example.com/report.pdf',
  file_name: 'report.pdf',
  uploaded_by: 'test-user'
};

const testFollowUpInput: CreateFollowUpActionInput = {
  report_id: 1, // Will be set after creating the report
  action_description: 'Test follow-up action to be deleted',
  assigned_to: 'test-assignee',
  due_date: new Date('2024-12-31'),
  notes: 'Test notes for deletion'
};

describe('deleteFollowUpAction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing follow-up action', async () => {
    // Create a report first
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput.title,
        description: testReportInput.description,
        report_type: testReportInput.report_type,
        file_url: testReportInput.file_url,
        file_name: testReportInput.file_name,
        uploaded_by: testReportInput.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Create a follow-up action
    const followUpResult = await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: testFollowUpInput.action_description,
        assigned_to: testFollowUpInput.assigned_to,
        due_date: testFollowUpInput.due_date,
        notes: testFollowUpInput.notes
      })
      .returning()
      .execute();

    const followUpId = followUpResult[0].id;

    // Delete the follow-up action
    const result = await deleteFollowUpAction(followUpId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the follow-up action no longer exists in database
    const remainingActions = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.id, followUpId))
      .execute();

    expect(remainingActions).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent follow-up action', async () => {
    const nonExistentId = 99999;

    const result = await deleteFollowUpAction(nonExistentId);

    expect(result).toBe(false);
  });

  it('should not affect other follow-up actions when deleting one', async () => {
    // Create a report first
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput.title,
        description: testReportInput.description,
        report_type: testReportInput.report_type,
        file_url: testReportInput.file_url,
        file_name: testReportInput.file_name,
        uploaded_by: testReportInput.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Create two follow-up actions
    const followUp1Result = await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'First follow-up action',
        assigned_to: 'user1',
        due_date: new Date('2024-12-31'),
        notes: 'First action notes'
      })
      .returning()
      .execute();

    const followUp2Result = await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'Second follow-up action',
        assigned_to: 'user2',
        due_date: new Date('2025-01-15'),
        notes: 'Second action notes'
      })
      .returning()
      .execute();

    const followUpId1 = followUp1Result[0].id;
    const followUpId2 = followUp2Result[0].id;

    // Delete the first follow-up action
    const result = await deleteFollowUpAction(followUpId1);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the first follow-up action is deleted
    const deletedAction = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.id, followUpId1))
      .execute();

    expect(deletedAction).toHaveLength(0);

    // Verify the second follow-up action still exists
    const remainingAction = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.id, followUpId2))
      .execute();

    expect(remainingAction).toHaveLength(1);
    expect(remainingAction[0].action_description).toEqual('Second follow-up action');
    expect(remainingAction[0].assigned_to).toEqual('user2');
    expect(remainingAction[0].notes).toEqual('Second action notes');
  });

  it('should handle deletion of follow-up action with minimal data', async () => {
    // Create a report first
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput.title,
        description: testReportInput.description,
        report_type: testReportInput.report_type,
        file_url: testReportInput.file_url,
        file_name: testReportInput.file_name,
        uploaded_by: testReportInput.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Create a follow-up action with minimal required fields only
    const minimalFollowUpResult = await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'Minimal follow-up action'
        // All other fields are nullable or have defaults
      })
      .returning()
      .execute();

    const followUpId = minimalFollowUpResult[0].id;

    // Delete the follow-up action
    const result = await deleteFollowUpAction(followUpId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the follow-up action no longer exists in database
    const remainingActions = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.id, followUpId))
      .execute();

    expect(remainingActions).toHaveLength(0);
  });
});