import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable } from '../db/schema';
import { type CreateReportInput } from '../schema';
import { createReport } from '../handlers/create_report';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateReportInput = {
  title: 'Test Oversight Report',
  description: 'A comprehensive oversight report for testing purposes',
  report_type: 'oversight',
  file_url: 'https://example.com/reports/test-report.pdf',
  file_name: 'test-report.pdf',
  uploaded_by: 'john.doe@example.com'
};

// Test input with minimal required fields
const minimalInput: CreateReportInput = {
  title: 'Minimal Report',
  description: null,
  report_type: 'audit',
  file_url: null,
  file_name: null,
  uploaded_by: 'jane.smith@example.com'
};

describe('createReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a report with all fields', async () => {
    const result = await createReport(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Oversight Report');
    expect(result.description).toEqual('A comprehensive oversight report for testing purposes');
    expect(result.report_type).toEqual('oversight');
    expect(result.status).toEqual('pending'); // Default status
    expect(result.file_url).toEqual('https://example.com/reports/test-report.pdf');
    expect(result.file_name).toEqual('test-report.pdf');
    expect(result.uploaded_by).toEqual('john.doe@example.com');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a report with minimal fields', async () => {
    const result = await createReport(minimalInput);

    expect(result.title).toEqual('Minimal Report');
    expect(result.description).toBeNull();
    expect(result.report_type).toEqual('audit');
    expect(result.status).toEqual('pending');
    expect(result.file_url).toBeNull();
    expect(result.file_name).toBeNull();
    expect(result.uploaded_by).toEqual('jane.smith@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save report to database', async () => {
    const result = await createReport(testInput);

    // Query the database directly
    const reports = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, result.id))
      .execute();

    expect(reports).toHaveLength(1);
    const savedReport = reports[0];
    expect(savedReport.title).toEqual('Test Oversight Report');
    expect(savedReport.description).toEqual('A comprehensive oversight report for testing purposes');
    expect(savedReport.report_type).toEqual('oversight');
    expect(savedReport.status).toEqual('pending');
    expect(savedReport.file_url).toEqual('https://example.com/reports/test-report.pdf');
    expect(savedReport.file_name).toEqual('test-report.pdf');
    expect(savedReport.uploaded_by).toEqual('john.doe@example.com');
    expect(savedReport.created_at).toBeInstanceOf(Date);
    expect(savedReport.updated_at).toBeInstanceOf(Date);
  });

  it('should create reports with different report types', async () => {
    const oversightInput = { ...testInput, report_type: 'oversight' as const };
    const auditInput = { ...testInput, report_type: 'audit' as const };
    const reviewInput = { ...testInput, report_type: 'review' as const };

    const oversightResult = await createReport(oversightInput);
    const auditResult = await createReport(auditInput);
    const reviewResult = await createReport(reviewInput);

    expect(oversightResult.report_type).toEqual('oversight');
    expect(auditResult.report_type).toEqual('audit');
    expect(reviewResult.report_type).toEqual('review');

    // Verify all are saved with unique IDs
    expect(oversightResult.id).not.toEqual(auditResult.id);
    expect(auditResult.id).not.toEqual(reviewResult.id);
    expect(oversightResult.id).not.toEqual(reviewResult.id);
  });

  it('should handle file information correctly', async () => {
    const inputWithFile = {
      ...testInput,
      file_url: 'https://storage.example.com/documents/report-123.docx',
      file_name: 'quarterly-oversight-report-q3-2024.docx'
    };

    const result = await createReport(inputWithFile);

    expect(result.file_url).toEqual('https://storage.example.com/documents/report-123.docx');
    expect(result.file_name).toEqual('quarterly-oversight-report-q3-2024.docx');
  });

  it('should handle null description and file fields', async () => {
    const inputWithNulls: CreateReportInput = {
      title: 'Report with Nulls',
      description: null,
      report_type: 'review',
      file_url: null,
      file_name: null,
      uploaded_by: 'test@example.com'
    };

    const result = await createReport(inputWithNulls);

    expect(result.description).toBeNull();
    expect(result.file_url).toBeNull();
    expect(result.file_name).toBeNull();
    expect(result.title).toEqual('Report with Nulls');
    expect(result.uploaded_by).toEqual('test@example.com');
  });

  it('should set created_at and updated_at to recent timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createReport(testInput);
    const afterCreation = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});