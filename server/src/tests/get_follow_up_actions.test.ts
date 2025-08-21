import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable, followUpActionsTable } from '../db/schema';
import { type CreateReportInput, type CreateFollowUpActionInput } from '../schema';
import { getFollowUpActionsByReportId, getPendingFollowUpActions } from '../handlers/get_follow_up_actions';
import { eq } from 'drizzle-orm';

// Test data
const testReportInput1: CreateReportInput = {
  title: 'Test Report 1',
  description: 'First test report',
  report_type: 'oversight',
  file_url: null,
  file_name: null,
  uploaded_by: 'test_user_1'
};

const testReportInput2: CreateReportInput = {
  title: 'Test Report 2',
  description: 'Second test report',
  report_type: 'audit',
  file_url: null,
  file_name: null,
  uploaded_by: 'test_user_2'
};

describe('getFollowUpActionsByReportId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no follow-up actions exist for report', async () => {
    // Create a report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput1.title,
        description: testReportInput1.description,
        report_type: testReportInput1.report_type,
        file_url: testReportInput1.file_url,
        file_name: testReportInput1.file_name,
        uploaded_by: testReportInput1.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    const result = await getFollowUpActionsByReportId(reportId);

    expect(result).toEqual([]);
  });

  it('should return follow-up actions for specific report', async () => {
    // Create two reports
    const reportResults = await db.insert(reportsTable)
      .values([
        {
          title: testReportInput1.title,
          description: testReportInput1.description,
          report_type: testReportInput1.report_type,
          file_url: testReportInput1.file_url,
          file_name: testReportInput1.file_name,
          uploaded_by: testReportInput1.uploaded_by
        },
        {
          title: testReportInput2.title,
          description: testReportInput2.description,
          report_type: testReportInput2.report_type,
          file_url: testReportInput2.file_url,
          file_name: testReportInput2.file_name,
          uploaded_by: testReportInput2.uploaded_by
        }
      ])
      .returning()
      .execute();

    const report1Id = reportResults[0].id;
    const report2Id = reportResults[1].id;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Create follow-up actions for both reports
    await db.insert(followUpActionsTable)
      .values([
        {
          report_id: report1Id,
          action_description: 'Action 1 for Report 1',
          assigned_to: 'user1',
          due_date: dueDate,
          notes: 'Test notes 1'
        },
        {
          report_id: report1Id,
          action_description: 'Action 2 for Report 1',
          assigned_to: 'user2',
          due_date: null,
          notes: null
        },
        {
          report_id: report2Id,
          action_description: 'Action 1 for Report 2',
          assigned_to: null,
          due_date: dueDate,
          notes: 'Should not be included'
        }
      ])
      .execute();

    const result = await getFollowUpActionsByReportId(report1Id);

    expect(result).toHaveLength(2);
    expect(result[0].action_description).toEqual('Action 1 for Report 1');
    expect(result[0].assigned_to).toEqual('user1');
    expect(result[0].report_id).toEqual(report1Id);
    expect(result[0].status).toEqual('not_started'); // Default status
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].action_description).toEqual('Action 2 for Report 1');
    expect(result[1].assigned_to).toEqual('user2');
    expect(result[1].report_id).toEqual(report1Id);
    expect(result[1].due_date).toBeNull();
  });

  it('should order results by created_at', async () => {
    // Create a report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput1.title,
        description: testReportInput1.description,
        report_type: testReportInput1.report_type,
        file_url: testReportInput1.file_url,
        file_name: testReportInput1.file_name,
        uploaded_by: testReportInput1.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Create multiple follow-up actions with a small delay to ensure different timestamps
    await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'First action',
        assigned_to: null,
        due_date: null,
        notes: null
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'Second action',
        assigned_to: null,
        due_date: null,
        notes: null
      })
      .execute();

    const result = await getFollowUpActionsByReportId(reportId);

    expect(result).toHaveLength(2);
    expect(result[0].action_description).toEqual('First action');
    expect(result[1].action_description).toEqual('Second action');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should return empty array for non-existent report', async () => {
    const result = await getFollowUpActionsByReportId(99999);
    expect(result).toEqual([]);
  });
});

describe('getPendingFollowUpActions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pending follow-up actions exist', async () => {
    // Create a report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput1.title,
        description: testReportInput1.description,
        report_type: testReportInput1.report_type,
        file_url: testReportInput1.file_url,
        file_name: testReportInput1.file_name,
        uploaded_by: testReportInput1.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    // Create a completed follow-up action
    await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'Completed action',
        assigned_to: 'user1',
        status: 'completed',
        due_date: null,
        completion_date: new Date(),
        notes: null
      })
      .execute();

    const result = await getPendingFollowUpActions();

    expect(result).toEqual([]);
  });

  it('should return follow-up actions with not_started status', async () => {
    // Create a report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput1.title,
        description: testReportInput1.description,
        report_type: testReportInput1.report_type,
        file_url: testReportInput1.file_url,
        file_name: testReportInput1.file_name,
        uploaded_by: testReportInput1.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Create follow-up actions with different statuses
    await db.insert(followUpActionsTable)
      .values([
        {
          report_id: reportId,
          action_description: 'Not started action',
          assigned_to: 'user1',
          status: 'not_started',
          due_date: dueDate,
          notes: 'Pending action'
        },
        {
          report_id: reportId,
          action_description: 'Completed action',
          assigned_to: 'user2',
          status: 'completed',
          due_date: dueDate,
          completion_date: new Date(),
          notes: 'Should not appear'
        }
      ])
      .execute();

    const result = await getPendingFollowUpActions();

    expect(result).toHaveLength(1);
    expect(result[0].action_description).toEqual('Not started action');
    expect(result[0].status).toEqual('not_started');
    expect(result[0].assigned_to).toEqual('user1');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].notes).toEqual('Pending action');
  });

  it('should return follow-up actions with in_progress status', async () => {
    // Create a report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput1.title,
        description: testReportInput1.description,
        report_type: testReportInput1.report_type,
        file_url: testReportInput1.file_url,
        file_name: testReportInput1.file_name,
        uploaded_by: testReportInput1.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;

    await db.insert(followUpActionsTable)
      .values({
        report_id: reportId,
        action_description: 'In progress action',
        assigned_to: 'user1',
        status: 'in_progress',
        due_date: null,
        notes: 'Currently working on it'
      })
      .execute();

    const result = await getPendingFollowUpActions();

    expect(result).toHaveLength(1);
    expect(result[0].action_description).toEqual('In progress action');
    expect(result[0].status).toEqual('in_progress');
    expect(result[0].assigned_to).toEqual('user1');
    expect(result[0].notes).toEqual('Currently working on it');
  });

  it('should return both not_started and in_progress actions', async () => {
    // Create a report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput1.title,
        description: testReportInput1.description,
        report_type: testReportInput1.report_type,
        file_url: testReportInput1.file_url,
        file_name: testReportInput1.file_name,
        uploaded_by: testReportInput1.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;
    const dueDate1 = new Date();
    dueDate1.setDate(dueDate1.getDate() + 3);
    const dueDate2 = new Date();
    dueDate2.setDate(dueDate2.getDate() + 10);

    await db.insert(followUpActionsTable)
      .values([
        {
          report_id: reportId,
          action_description: 'Not started action',
          assigned_to: 'user1',
          status: 'not_started',
          due_date: dueDate2, // Later due date
          notes: null
        },
        {
          report_id: reportId,
          action_description: 'In progress action',
          assigned_to: 'user2',
          status: 'in_progress',
          due_date: dueDate1, // Earlier due date
          notes: null
        },
        {
          report_id: reportId,
          action_description: 'Completed action',
          assigned_to: 'user3',
          status: 'completed',
          due_date: dueDate1,
          completion_date: new Date(),
          notes: 'Should not appear'
        }
      ])
      .execute();

    const result = await getPendingFollowUpActions();

    expect(result).toHaveLength(2);
    // Results should be ordered by due_date (earlier first)
    expect(result[0].action_description).toEqual('In progress action');
    expect(result[0].status).toEqual('in_progress');
    expect(result[1].action_description).toEqual('Not started action');
    expect(result[1].status).toEqual('not_started');
  });

  it('should handle null due_dates in ordering', async () => {
    // Create a report
    const reportResult = await db.insert(reportsTable)
      .values({
        title: testReportInput1.title,
        description: testReportInput1.description,
        report_type: testReportInput1.report_type,
        file_url: testReportInput1.file_url,
        file_name: testReportInput1.file_name,
        uploaded_by: testReportInput1.uploaded_by
      })
      .returning()
      .execute();

    const reportId = reportResult[0].id;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    await db.insert(followUpActionsTable)
      .values([
        {
          report_id: reportId,
          action_description: 'Action with due date',
          assigned_to: 'user1',
          status: 'not_started',
          due_date: dueDate,
          notes: null
        },
        {
          report_id: reportId,
          action_description: 'Action without due date',
          assigned_to: 'user2',
          status: 'in_progress',
          due_date: null,
          notes: null
        }
      ])
      .execute();

    const result = await getPendingFollowUpActions();

    expect(result).toHaveLength(2);
    // Actions with null due_date should come after those with dates
    expect(result[0].action_description).toEqual('Action with due date');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[1].action_description).toEqual('Action without due date');
    expect(result[1].due_date).toBeNull();
  });
});