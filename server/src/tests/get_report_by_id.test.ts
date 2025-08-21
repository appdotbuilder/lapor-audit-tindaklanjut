import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable, followUpActionsTable } from '../db/schema';
import { getReportById } from '../handlers/get_report_by_id';

describe('getReportById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when report does not exist', async () => {
    const result = await getReportById(999);
    expect(result).toBeNull();
  });

  it('should return report without follow-up actions', async () => {
    // Create a test report
    const [report] = await db.insert(reportsTable)
      .values({
        title: 'Test Report',
        description: 'Test description',
        report_type: 'audit',
        status: 'pending',
        file_url: 'https://example.com/report.pdf',
        file_name: 'report.pdf',
        uploaded_by: 'test@example.com'
      })
      .returning()
      .execute();

    const result = await getReportById(report.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(report.id);
    expect(result!.title).toBe('Test Report');
    expect(result!.description).toBe('Test description');
    expect(result!.report_type).toBe('audit');
    expect(result!.status).toBe('pending');
    expect(result!.file_url).toBe('https://example.com/report.pdf');
    expect(result!.file_name).toBe('report.pdf');
    expect(result!.uploaded_by).toBe('test@example.com');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.follow_up_actions).toEqual([]);
  });

  it('should return report with follow-up actions', async () => {
    // Create a test report
    const [report] = await db.insert(reportsTable)
      .values({
        title: 'Report with Actions',
        description: null,
        report_type: 'oversight',
        status: 'in_progress',
        file_url: null,
        file_name: null,
        uploaded_by: 'admin@example.com'
      })
      .returning()
      .execute();

    // Create follow-up actions
    const dueDate = new Date('2024-12-31');
    const completionDate = new Date('2024-12-25');

    await db.insert(followUpActionsTable)
      .values([
        {
          report_id: report.id,
          action_description: 'First action',
          assigned_to: 'user1@example.com',
          status: 'completed',
          due_date: dueDate,
          completion_date: completionDate,
          notes: 'Completed on time'
        },
        {
          report_id: report.id,
          action_description: 'Second action',
          assigned_to: null,
          status: 'in_progress',
          due_date: null,
          completion_date: null,
          notes: null
        }
      ])
      .execute();

    const result = await getReportById(report.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(report.id);
    expect(result!.title).toBe('Report with Actions');
    expect(result!.description).toBeNull();
    expect(result!.report_type).toBe('oversight');
    expect(result!.status).toBe('in_progress');
    expect(result!.file_url).toBeNull();
    expect(result!.file_name).toBeNull();
    expect(result!.uploaded_by).toBe('admin@example.com');

    // Verify follow-up actions
    expect(result!.follow_up_actions).toHaveLength(2);

    const firstAction = result!.follow_up_actions.find(a => a.action_description === 'First action');
    expect(firstAction).toBeDefined();
    expect(firstAction!.assigned_to).toBe('user1@example.com');
    expect(firstAction!.status).toBe('completed');
    expect(firstAction!.due_date).toEqual(dueDate);
    expect(firstAction!.completion_date).toEqual(completionDate);
    expect(firstAction!.notes).toBe('Completed on time');
    expect(firstAction!.created_at).toBeInstanceOf(Date);
    expect(firstAction!.updated_at).toBeInstanceOf(Date);

    const secondAction = result!.follow_up_actions.find(a => a.action_description === 'Second action');
    expect(secondAction).toBeDefined();
    expect(secondAction!.assigned_to).toBeNull();
    expect(secondAction!.status).toBe('in_progress');
    expect(secondAction!.due_date).toBeNull();
    expect(secondAction!.completion_date).toBeNull();
    expect(secondAction!.notes).toBeNull();
  });

  it('should handle multiple reports correctly', async () => {
    // Create two reports
    const [report1] = await db.insert(reportsTable)
      .values({
        title: 'First Report',
        description: 'First description',
        report_type: 'review',
        status: 'completed',
        file_url: 'https://example.com/first.pdf',
        file_name: 'first.pdf',
        uploaded_by: 'user1@example.com'
      })
      .returning()
      .execute();

    const [report2] = await db.insert(reportsTable)
      .values({
        title: 'Second Report',
        description: 'Second description',
        report_type: 'audit',
        status: 'pending',
        file_url: 'https://example.com/second.pdf',
        file_name: 'second.pdf',
        uploaded_by: 'user2@example.com'
      })
      .returning()
      .execute();

    // Add actions to both reports
    await db.insert(followUpActionsTable)
      .values([
        {
          report_id: report1.id,
          action_description: 'Action for report 1',
          assigned_to: 'user1@example.com',
          status: 'completed',
          due_date: null,
          completion_date: null,
          notes: null
        },
        {
          report_id: report2.id,
          action_description: 'Action for report 2',
          assigned_to: 'user2@example.com',
          status: 'not_started',
          due_date: null,
          completion_date: null,
          notes: null
        }
      ])
      .execute();

    // Test getting each report separately
    const result1 = await getReportById(report1.id);
    const result2 = await getReportById(report2.id);

    // Verify first report
    expect(result1).not.toBeNull();
    expect(result1!.title).toBe('First Report');
    expect(result1!.follow_up_actions).toHaveLength(1);
    expect(result1!.follow_up_actions[0].action_description).toBe('Action for report 1');

    // Verify second report
    expect(result2).not.toBeNull();
    expect(result2!.title).toBe('Second Report');
    expect(result2!.follow_up_actions).toHaveLength(1);
    expect(result2!.follow_up_actions[0].action_description).toBe('Action for report 2');
  });

  it('should handle edge cases with dates and nullable fields', async () => {
    // Create report with all nullable fields set to null
    const [report] = await db.insert(reportsTable)
      .values({
        title: 'Minimal Report',
        description: null,
        report_type: 'oversight',
        status: 'pending',
        file_url: null,
        file_name: null,
        uploaded_by: 'minimal@example.com'
      })
      .returning()
      .execute();

    // Create follow-up action with mixed null and non-null fields
    await db.insert(followUpActionsTable)
      .values({
        report_id: report.id,
        action_description: 'Mixed nulls action',
        assigned_to: null,
        status: 'not_started',
        due_date: new Date('2025-01-15'),
        completion_date: null,
        notes: 'Some notes here'
      })
      .execute();

    const result = await getReportById(report.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.file_url).toBeNull();
    expect(result!.file_name).toBeNull();
    
    expect(result!.follow_up_actions).toHaveLength(1);
    const action = result!.follow_up_actions[0];
    expect(action.assigned_to).toBeNull();
    expect(action.due_date).toEqual(new Date('2025-01-15'));
    expect(action.completion_date).toBeNull();
    expect(action.notes).toBe('Some notes here');
  });
});