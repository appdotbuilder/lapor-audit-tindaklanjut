import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reportsTable } from '../db/schema';
import { type CreateReportInput, type UpdateReportInput } from '../schema';
import { updateReport } from '../handlers/update_report';
import { eq } from 'drizzle-orm';

// Helper function to create a test report
const createTestReport = async (data: Partial<CreateReportInput> = {}) => {
  const testData = {
    title: 'Test Report',
    description: 'Test description',
    report_type: 'oversight' as const,
    file_url: 'https://example.com/report.pdf',
    file_name: 'report.pdf',
    uploaded_by: 'test_user',
    ...data
  };

  const result = await db.insert(reportsTable)
    .values(testData)
    .returning()
    .execute();

  return result[0];
};

describe('updateReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an existing report', async () => {
    // Create test report
    const report = await createTestReport();

    const updateInput: UpdateReportInput = {
      id: report.id,
      title: 'Updated Title',
      description: 'Updated description',
      report_type: 'audit',
      status: 'in_progress',
      file_url: 'https://example.com/updated.pdf',
      file_name: 'updated.pdf'
    };

    const result = await updateReport(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(report.id);
    expect(result!.title).toBe('Updated Title');
    expect(result!.description).toBe('Updated description');
    expect(result!.report_type).toBe('audit');
    expect(result!.status).toBe('in_progress');
    expect(result!.file_url).toBe('https://example.com/updated.pdf');
    expect(result!.file_name).toBe('updated.pdf');
    expect(result!.uploaded_by).toBe(report.uploaded_by); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(report.updated_at.getTime());
  });

  it('should update only provided fields', async () => {
    // Create test report
    const report = await createTestReport({
      title: 'Original Title',
      description: 'Original description',
      report_type: 'oversight'
    });

    const updateInput: UpdateReportInput = {
      id: report.id,
      title: 'Updated Title Only',
      status: 'completed'
    };

    const result = await updateReport(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Updated Title Only');
    expect(result!.status).toBe('completed');
    // These should remain unchanged
    expect(result!.description).toBe('Original description');
    expect(result!.report_type).toBe('oversight');
    expect(result!.file_url).toBe(report.file_url);
    expect(result!.file_name).toBe(report.file_name);
    expect(result!.uploaded_by).toBe(report.uploaded_by);
  });

  it('should handle nullable fields correctly', async () => {
    // Create test report with nullable fields
    const report = await createTestReport({
      description: 'Original description',
      file_url: 'https://example.com/original.pdf',
      file_name: 'original.pdf'
    });

    const updateInput: UpdateReportInput = {
      id: report.id,
      description: null,
      file_url: null,
      file_name: null
    };

    const result = await updateReport(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.file_url).toBeNull();
    expect(result!.file_name).toBeNull();
    // Other fields should remain unchanged
    expect(result!.title).toBe(report.title);
    expect(result!.report_type).toBe(report.report_type);
    expect(result!.status).toBe(report.status);
  });

  it('should return null for non-existent report', async () => {
    const updateInput: UpdateReportInput = {
      id: 999999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateReport(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes in database', async () => {
    // Create test report
    const report = await createTestReport();

    const updateInput: UpdateReportInput = {
      id: report.id,
      title: 'Persisted Title',
      description: 'Persisted description',
      status: 'completed'
    };

    await updateReport(updateInput);

    // Query directly from database to verify persistence
    const dbReport = await db.select()
      .from(reportsTable)
      .where(eq(reportsTable.id, report.id))
      .execute();

    expect(dbReport).toHaveLength(1);
    expect(dbReport[0].title).toBe('Persisted Title');
    expect(dbReport[0].description).toBe('Persisted description');
    expect(dbReport[0].status).toBe('completed');
    expect(dbReport[0].updated_at).toBeInstanceOf(Date);
    expect(dbReport[0].updated_at.getTime()).toBeGreaterThan(report.updated_at.getTime());
  });

  it('should update different report types correctly', async () => {
    // Create reports with different types
    const oversightReport = await createTestReport({ report_type: 'oversight' });
    const auditReport = await createTestReport({ report_type: 'audit' });
    const reviewReport = await createTestReport({ report_type: 'review' });

    // Update oversight to audit
    await updateReport({
      id: oversightReport.id,
      report_type: 'audit',
      status: 'in_progress'
    });

    // Update audit to review
    await updateReport({
      id: auditReport.id,
      report_type: 'review',
      status: 'completed'
    });

    // Update review to oversight
    await updateReport({
      id: reviewReport.id,
      report_type: 'oversight',
      status: 'in_progress'
    });

    // Verify all updates
    const reports = await db.select()
      .from(reportsTable)
      .execute();

    const updatedOversight = reports.find(r => r.id === oversightReport.id);
    const updatedAudit = reports.find(r => r.id === auditReport.id);
    const updatedReview = reports.find(r => r.id === reviewReport.id);

    expect(updatedOversight!.report_type).toBe('audit');
    expect(updatedOversight!.status).toBe('in_progress');

    expect(updatedAudit!.report_type).toBe('review');
    expect(updatedAudit!.status).toBe('completed');

    expect(updatedReview!.report_type).toBe('oversight');
    expect(updatedReview!.status).toBe('in_progress');
  });

  it('should handle all status transitions correctly', async () => {
    // Create reports with different statuses
    const pendingReport = await createTestReport();
    const inProgressReport = await createTestReport();
    const completedReport = await createTestReport();

    // Update to all possible statuses
    await updateReport({ id: pendingReport.id, status: 'in_progress' });
    await updateReport({ id: inProgressReport.id, status: 'completed' });
    await updateReport({ id: completedReport.id, status: 'pending' });

    // Verify status updates
    const reports = await db.select()
      .from(reportsTable)
      .execute();

    const updatedPending = reports.find(r => r.id === pendingReport.id);
    const updatedInProgress = reports.find(r => r.id === inProgressReport.id);
    const updatedCompleted = reports.find(r => r.id === completedReport.id);

    expect(updatedPending!.status).toBe('in_progress');
    expect(updatedInProgress!.status).toBe('completed');
    expect(updatedCompleted!.status).toBe('pending');
  });
});