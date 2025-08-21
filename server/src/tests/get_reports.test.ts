import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable } from '../db/schema';
import { type GetReportsInput, type CreateReportInput } from '../schema';
import { getReports } from '../handlers/get_reports';
import { eq } from 'drizzle-orm';

// Helper function to create test reports
const createTestReport = async (overrides: Partial<CreateReportInput> = {}) => {
  const defaultReport: CreateReportInput = {
    title: 'Test Report',
    description: 'A test report for testing purposes',
    report_type: 'oversight',
    file_url: 'https://example.com/report.pdf',
    file_name: 'report.pdf',
    uploaded_by: 'test_user'
  };

  const reportData = { ...defaultReport, ...overrides };
  
  const result = await db.insert(reportsTable)
    .values({
      title: reportData.title,
      description: reportData.description,
      report_type: reportData.report_type,
      file_url: reportData.file_url,
      file_name: reportData.file_name,
      uploaded_by: reportData.uploaded_by
    })
    .returning()
    .execute();

  return result[0];
};

describe('getReports', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all reports when no filters are provided', async () => {
    // Create test reports
    await createTestReport({ title: 'Report 1', report_type: 'oversight' });
    await createTestReport({ title: 'Report 2', report_type: 'audit' });
    await createTestReport({ title: 'Report 3', report_type: 'review' });

    const results = await getReports();

    expect(results).toHaveLength(3);
    expect(results.map(r => r.title).sort()).toEqual(['Report 1', 'Report 2', 'Report 3']);
  });

  it('should return empty array when no reports exist', async () => {
    const results = await getReports();
    expect(results).toHaveLength(0);
  });

  it('should filter reports by report_type', async () => {
    // Create reports with different types
    await createTestReport({ title: 'Oversight Report', report_type: 'oversight' });
    await createTestReport({ title: 'Audit Report', report_type: 'audit' });
    await createTestReport({ title: 'Review Report', report_type: 'review' });

    const filters: GetReportsInput = { report_type: 'audit' };
    const results = await getReports(filters);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Audit Report');
    expect(results[0].report_type).toEqual('audit');
  });

  it('should filter reports by status', async () => {
    // Create reports with different statuses
    const report1 = await createTestReport({ title: 'Pending Report' });
    const report2 = await createTestReport({ title: 'Completed Report' });

    // Update one report to completed status
    await db.update(reportsTable)
      .set({ status: 'completed' })
      .where(eq(reportsTable.id, report2.id))
      .execute();

    const filters: GetReportsInput = { status: 'completed' };
    const results = await getReports(filters);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Completed Report');
    expect(results[0].status).toEqual('completed');
  });

  it('should filter reports by uploaded_by', async () => {
    // Create reports uploaded by different users
    await createTestReport({ title: 'User 1 Report', uploaded_by: 'user1' });
    await createTestReport({ title: 'User 2 Report', uploaded_by: 'user2' });
    await createTestReport({ title: 'Another User 1 Report', uploaded_by: 'user1' });

    const filters: GetReportsInput = { uploaded_by: 'user1' };
    const results = await getReports(filters);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.uploaded_by === 'user1')).toBe(true);
    expect(results.map(r => r.title).sort()).toEqual(['Another User 1 Report', 'User 1 Report']);
  });

  it('should filter reports by multiple criteria', async () => {
    // Create reports with various combinations
    await createTestReport({ 
      title: 'Matching Report', 
      report_type: 'audit', 
      uploaded_by: 'user1' 
    });
    await createTestReport({ 
      title: 'Wrong Type', 
      report_type: 'oversight', 
      uploaded_by: 'user1' 
    });
    await createTestReport({ 
      title: 'Wrong User', 
      report_type: 'audit', 
      uploaded_by: 'user2' 
    });

    const filters: GetReportsInput = { 
      report_type: 'audit', 
      uploaded_by: 'user1' 
    };
    const results = await getReports(filters);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Matching Report');
    expect(results[0].report_type).toEqual('audit');
    expect(results[0].uploaded_by).toEqual('user1');
  });

  it('should return reports with all expected fields', async () => {
    const testReport = await createTestReport({
      title: 'Complete Report',
      description: 'A complete test report',
      report_type: 'review',
      file_url: 'https://example.com/test.pdf',
      file_name: 'test.pdf',
      uploaded_by: 'test_user'
    });

    const results = await getReports();

    expect(results).toHaveLength(1);
    const report = results[0];
    
    expect(report.id).toBeDefined();
    expect(report.title).toEqual('Complete Report');
    expect(report.description).toEqual('A complete test report');
    expect(report.report_type).toEqual('review');
    expect(report.status).toEqual('pending'); // Default status
    expect(report.file_url).toEqual('https://example.com/test.pdf');
    expect(report.file_name).toEqual('test.pdf');
    expect(report.uploaded_by).toEqual('test_user');
    expect(report.created_at).toBeInstanceOf(Date);
    expect(report.updated_at).toBeInstanceOf(Date);
  });

  it('should handle reports with null values correctly', async () => {
    await createTestReport({
      title: 'Minimal Report',
      description: null,
      file_url: null,
      file_name: null,
      uploaded_by: 'test_user'
    });

    const results = await getReports();

    expect(results).toHaveLength(1);
    const report = results[0];
    
    expect(report.title).toEqual('Minimal Report');
    expect(report.description).toBeNull();
    expect(report.file_url).toBeNull();
    expect(report.file_name).toBeNull();
    expect(report.uploaded_by).toEqual('test_user');
  });

  it('should return no results when filtering by non-existent values', async () => {
    await createTestReport({ report_type: 'oversight', uploaded_by: 'user1' });

    // Filter by non-existent report type
    const results1 = await getReports({ report_type: 'audit' });
    expect(results1).toHaveLength(0);

    // Filter by non-existent user
    const results2 = await getReports({ uploaded_by: 'nonexistent_user' });
    expect(results2).toHaveLength(0);

    // Filter by non-existent status
    const results3 = await getReports({ status: 'completed' });
    expect(results3).toHaveLength(0);
  });
});