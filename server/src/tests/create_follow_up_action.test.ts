import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable, followUpActionsTable } from '../db/schema';
import { type CreateFollowUpActionInput } from '../schema';
import { createFollowUpAction } from '../handlers/create_follow_up_action';
import { eq } from 'drizzle-orm';

// Test report data
const testReport = {
  title: 'Test Report',
  description: 'A report for testing follow-up actions',
  report_type: 'oversight' as const,
  uploaded_by: 'test_user'
};

// Test follow-up action input
const testFollowUpAction: CreateFollowUpActionInput = {
  report_id: 1, // Will be set after creating report
  action_description: 'Review financial statements',
  assigned_to: 'audit_team@example.com',
  due_date: new Date('2024-12-31'),
  notes: 'Priority action requiring immediate attention'
};

describe('createFollowUpAction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a follow-up action successfully', async () => {
    // Create prerequisite report
    const reportResult = await db.insert(reportsTable)
      .values(testReport)
      .returning()
      .execute();
    const reportId = reportResult[0].id;

    // Create follow-up action
    const followUpInput = { ...testFollowUpAction, report_id: reportId };
    const result = await createFollowUpAction(followUpInput);

    // Validate basic fields
    expect(result.id).toBeDefined();
    expect(result.report_id).toEqual(reportId);
    expect(result.action_description).toEqual('Review financial statements');
    expect(result.assigned_to).toEqual('audit_team@example.com');
    expect(result.status).toEqual('not_started');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.completion_date).toBeNull();
    expect(result.notes).toEqual('Priority action requiring immediate attention');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save follow-up action to database', async () => {
    // Create prerequisite report
    const reportResult = await db.insert(reportsTable)
      .values(testReport)
      .returning()
      .execute();
    const reportId = reportResult[0].id;

    // Create follow-up action
    const followUpInput = { ...testFollowUpAction, report_id: reportId };
    const result = await createFollowUpAction(followUpInput);

    // Verify it was saved to database
    const savedActions = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.id, result.id))
      .execute();

    expect(savedActions).toHaveLength(1);
    expect(savedActions[0].report_id).toEqual(reportId);
    expect(savedActions[0].action_description).toEqual('Review financial statements');
    expect(savedActions[0].assigned_to).toEqual('audit_team@example.com');
    expect(savedActions[0].status).toEqual('not_started');
    expect(savedActions[0].due_date).toEqual(new Date('2024-12-31'));
    expect(savedActions[0].notes).toEqual('Priority action requiring immediate attention');
    expect(savedActions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create follow-up action with minimal data', async () => {
    // Create prerequisite report
    const reportResult = await db.insert(reportsTable)
      .values(testReport)
      .returning()
      .execute();
    const reportId = reportResult[0].id;

    // Create follow-up action with only required fields
    const minimalInput: CreateFollowUpActionInput = {
      report_id: reportId,
      action_description: 'Minimal action',
      assigned_to: null,
      due_date: null,
      notes: null
    };

    const result = await createFollowUpAction(minimalInput);

    expect(result.id).toBeDefined();
    expect(result.report_id).toEqual(reportId);
    expect(result.action_description).toEqual('Minimal action');
    expect(result.assigned_to).toBeNull();
    expect(result.status).toEqual('not_started');
    expect(result.due_date).toBeNull();
    expect(result.completion_date).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when report does not exist', async () => {
    // Try to create follow-up action for non-existent report
    const invalidInput = { ...testFollowUpAction, report_id: 999 };

    await expect(createFollowUpAction(invalidInput)).rejects.toThrow(/Report with ID 999 not found/i);
  });

  it('should handle multiple follow-up actions for same report', async () => {
    // Create prerequisite report
    const reportResult = await db.insert(reportsTable)
      .values(testReport)
      .returning()
      .execute();
    const reportId = reportResult[0].id;

    // Create first follow-up action
    const firstAction: CreateFollowUpActionInput = {
      report_id: reportId,
      action_description: 'First action',
      assigned_to: 'user1@example.com',
      due_date: new Date('2024-11-30'),
      notes: 'First priority'
    };

    // Create second follow-up action
    const secondAction: CreateFollowUpActionInput = {
      report_id: reportId,
      action_description: 'Second action',
      assigned_to: 'user2@example.com',
      due_date: new Date('2024-12-15'),
      notes: 'Second priority'
    };

    const result1 = await createFollowUpAction(firstAction);
    const result2 = await createFollowUpAction(secondAction);

    // Verify both actions were created
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.report_id).toEqual(reportId);
    expect(result2.report_id).toEqual(reportId);
    expect(result1.action_description).toEqual('First action');
    expect(result2.action_description).toEqual('Second action');

    // Verify both are in database
    const allActions = await db.select()
      .from(followUpActionsTable)
      .where(eq(followUpActionsTable.report_id, reportId))
      .execute();

    expect(allActions).toHaveLength(2);
  });
});