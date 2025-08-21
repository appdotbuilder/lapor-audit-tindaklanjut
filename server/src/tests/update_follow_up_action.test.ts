import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable, followUpActionsTable } from '../db/schema';
import { type UpdateFollowUpActionInput, type CreateReportInput } from '../schema';
import { updateFollowUpAction } from '../handlers/update_follow_up_action';
import { eq } from 'drizzle-orm';

// Test report data
const testReport: CreateReportInput = {
  title: 'Test Report',
  description: 'A test report',
  report_type: 'audit',
  file_url: null,
  file_name: null,
  uploaded_by: 'test_user'
};

describe('updateFollowUpAction', () => {
  let reportId: number;
  let followUpActionId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test report first
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReport.title,
        description: testReport.description,
        report_type: testReport.report_type,
        file_url: testReport.file_url,
        file_name: testReport.file_name,
        uploaded_by: testReport.uploaded_by
      })
      .returning()
      .execute();
    
    reportId = reportResult[0].id;

    // Create test follow-up action
    const followUpResult = await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'Original action description',
        assigned_to: 'original_assignee',
        status: 'not_started',
        due_date: new Date('2024-12-31'),
        notes: 'Original notes'
      })
      .returning()
      .execute();

    followUpActionId = followUpResult[0].id;
  });

  afterEach(resetDB);

  it('should update follow-up action with partial fields', async () => {
    const updateInput: UpdateFollowUpActionInput = {
      id: followUpActionId,
      action_description: 'Updated action description',
      assigned_to: 'new_assignee'
    };

    const result = await updateFollowUpAction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(followUpActionId);
    expect(result!.action_description).toEqual('Updated action description');
    expect(result!.assigned_to).toEqual('new_assignee');
    expect(result!.status).toEqual('not_started'); // Unchanged
    expect(result!.notes).toEqual('Original notes'); // Unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update status and auto-set completion_date when completed', async () => {
    const updateInput: UpdateFollowUpActionInput = {
      id: followUpActionId,
      status: 'completed'
    };

    const result = await updateFollowUpAction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.completion_date).toBeInstanceOf(Date);
    expect(result!.completion_date).not.toBeNull();
  });

  it('should update all fields when provided', async () => {
    const newDueDate = new Date('2025-01-15');
    const newCompletionDate = new Date('2024-12-20');
    
    const updateInput: UpdateFollowUpActionInput = {
      id: followUpActionId,
      action_description: 'Completely updated description',
      assigned_to: 'final_assignee',
      status: 'in_progress',
      due_date: newDueDate,
      completion_date: newCompletionDate,
      notes: 'Updated notes'
    };

    const result = await updateFollowUpAction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.action_description).toEqual('Completely updated description');
    expect(result!.assigned_to).toEqual('final_assignee');
    expect(result!.status).toEqual('in_progress');
    expect(result!.due_date).toEqual(newDueDate);
    expect(result!.completion_date).toEqual(newCompletionDate);
    expect(result!.notes).toEqual('Updated notes');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const updateInput: UpdateFollowUpActionInput = {
      id: followUpActionId,
      assigned_to: null,
      due_date: null,
      notes: null
    };

    const result = await updateFollowUpAction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.assigned_to).toBeNull();
    expect(result!.due_date).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.action_description).toEqual('Original action description'); // Unchanged
  });

  it('should return null for non-existent follow-up action', async () => {
    const updateInput: UpdateFollowUpActionInput = {
      id: 99999, // Non-existent ID
      action_description: 'This should not work'
    };

    const result = await updateFollowUpAction(updateInput);
    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateFollowUpActionInput = {
      id: followUpActionId,
      action_description: 'Database verification test',
      status: 'in_progress'
    };

    await updateFollowUpAction(updateInput);

    // Verify changes were saved to database
    const followUpActions = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.id, followUpActionId))
      .execute();

    expect(followUpActions).toHaveLength(1);
    expect(followUpActions[0].action_description).toEqual('Database verification test');
    expect(followUpActions[0].status).toEqual('in_progress');
    expect(followUpActions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should preserve original created_at timestamp', async () => {
    // Get original created_at
    const original = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.id, followUpActionId))
      .execute();

    const originalCreatedAt = original[0].created_at;

    const updateInput: UpdateFollowUpActionInput = {
      id: followUpActionId,
      action_description: 'Updated description'
    };

    const result = await updateFollowUpAction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at).not.toEqual(originalCreatedAt);
  });

  it('should override completion_date when setting status to completed', async () => {
    const manualCompletionDate = new Date('2024-01-01');
    
    const updateInput: UpdateFollowUpActionInput = {
      id: followUpActionId,
      status: 'completed',
      completion_date: manualCompletionDate // This should be overridden
    };

    const result = await updateFollowUpAction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.completion_date).toBeInstanceOf(Date);
    // Should be auto-set to current date, not the manual date
    expect(result!.completion_date).not.toEqual(manualCompletionDate);
  });
});