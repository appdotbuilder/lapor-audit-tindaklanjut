import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Calendar, User, Tag, Clock, CheckCircle, Plus } from 'lucide-react';
import { CreateFollowUpActionForm } from '@/components/CreateFollowUpActionForm';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Report, FollowUpAction, ReportWithFollowUps } from '../../../server/src/schema';

interface ReportDetailsDialogProps {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailsDialog({ report, open, onOpenChange }: ReportDetailsDialogProps) {
  const [reportWithFollowUps, setReportWithFollowUps] = useState<ReportWithFollowUps | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateFollowUp, setShowCreateFollowUp] = useState(false);

  const loadReportDetails = useCallback(async () => {
    if (!open) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getReportById.query({ id: report.id });
      
      if (result) {
        setReportWithFollowUps(result);
      } else {
        // Demo data when backend is not ready
        setReportWithFollowUps({
          ...report,
          follow_up_actions: report.id === 1 ? [
            {
              id: 1,
              report_id: 1,
              action_description: 'Implementasi rekomendasi sistem akuntansi baru',
              assigned_to: 'Tim IT',
              status: 'in_progress' as const,
              due_date: new Date('2024-04-15'),
              completion_date: null,
              notes: 'Progress 60% - sedang dalam tahap pengembangan modul akuntansi',
              created_at: new Date('2024-03-20'),
              updated_at: new Date('2024-03-28')
            },
            {
              id: 2,
              report_id: 1,
              action_description: 'Pelatihan staff untuk sistem baru',
              assigned_to: 'HRD',
              status: 'not_started' as const,
              due_date: new Date('2024-05-01'),
              completion_date: null,
              notes: null,
              created_at: new Date('2024-03-20'),
              updated_at: new Date('2024-03-20')
            }
          ] : report.id === 2 ? [
            {
              id: 3,
              report_id: 2,
              action_description: 'Upgrade keamanan server database',
              assigned_to: 'Tim Keamanan',
              status: 'completed' as const,
              due_date: new Date('2024-04-01'),
              completion_date: new Date('2024-03-28'),
              notes: 'Keamanan database telah ditingkatkan dengan enkripsi tambahan',
              created_at: new Date('2024-03-18'),
              updated_at: new Date('2024-03-28')
            }
          ] : []
        });
      }
    } catch (error) {
      console.error('Failed to load report details:', error);
      setReportWithFollowUps({
        ...report,
        follow_up_actions: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [report, open]);

  useEffect(() => {
    loadReportDetails();
  }, [loadReportDetails]);

  const handleFollowUpSuccess = (newAction: FollowUpAction) => {
    if (reportWithFollowUps) {
      setReportWithFollowUps({
        ...reportWithFollowUps,
        follow_up_actions: [...reportWithFollowUps.follow_up_actions, newAction]
      });
    }
    setShowCreateFollowUp(false);
  };

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Selesai</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">⏳ Berjalan</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">⏸️ Pending</Badge>;
    }
  };

  const getTypeBadge = (type: Report['report_type']) => {
    switch (type) {
      case 'oversight':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">👁️ Pengawasan</Badge>;
      case 'audit':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">🔍 Audit</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-cyan-100 text-cyan-800">📊 Review</Badge>;
    }
  };

  const getActionStatusBadge = (status: FollowUpAction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Selesai</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">🔄 Berjalan</Badge>;
      case 'not_started':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">⏸️ Belum Mulai</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Detail Laporan
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap laporan dan tindak lanjutnya
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ) : reportWithFollowUps ? (
          <div className="space-y-6">
            {/* Report Information */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{reportWithFollowUps.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getTypeBadge(reportWithFollowUps.report_type)}
                      {getStatusBadge(reportWithFollowUps.status)}
                      {reportWithFollowUps.file_name && (
                        <Badge variant="outline" className="text-xs">
                          📎 {reportWithFollowUps.file_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {reportWithFollowUps.file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        alert('Fitur unduh akan tersedia setelah backend diimplementasi');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Unduh File
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportWithFollowUps.description && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">📄 Deskripsi</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {reportWithFollowUps.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Diunggah oleh: <strong>{reportWithFollowUps.uploaded_by}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Dibuat: <strong>{reportWithFollowUps.created_at.toLocaleDateString('id-ID')}</strong></span>
                  </div>
                  {reportWithFollowUps.updated_at.getTime() !== reportWithFollowUps.created_at.getTime() && (
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <Clock className="w-4 h-4" />
                      <span>Terakhir diperbarui: <strong>{reportWithFollowUps.updated_at.toLocaleDateString('id-ID')}</strong></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Follow-up Actions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🎯 Tindak Lanjut</h3>
                  <p className="text-sm text-gray-600">
                    {reportWithFollowUps.follow_up_actions.length > 0
                      ? `${reportWithFollowUps.follow_up_actions.length} aksi tindak lanjut`
                      : 'Belum ada tindak lanjut'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateFollowUp(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Tindak Lanjut
                </Button>
              </div>

              {showCreateFollowUp && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base">➕ Tambah Tindak Lanjut Baru</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CreateFollowUpActionForm
                      reportId={reportWithFollowUps.id}
                      onSuccess={handleFollowUpSuccess}
                      onCancel={() => setShowCreateFollowUp(false)}
                    />
                  </CardContent>
                </Card>
              )}

              {reportWithFollowUps.follow_up_actions.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-900 mb-2">Belum Ada Tindak Lanjut</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Tambahkan aksi tindak lanjut untuk laporan ini
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateFollowUp(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Tindak Lanjut
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {reportWithFollowUps.follow_up_actions.map((action: FollowUpAction) => (
                    <Card key={action.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {action.action_description}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {getActionStatusBadge(action.status)}
                                {action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed' && (
                                  <Badge variant="destructive" className="text-xs">
                                    🚨 Terlambat
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>Ditugaskan: {action.assigned_to || 'Belum ditugaskan'}</span>
                            </div>
                            {action.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Deadline: {action.due_date.toLocaleDateString('id-ID')}</span>
                              </div>
                            )}
                            {action.completion_date && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Selesai: {action.completion_date.toLocaleDateString('id-ID')}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Dibuat: {action.created_at.toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>

                          {action.notes && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm text-gray-700">
                                <strong>📝 Catatan:</strong> {action.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Gagal memuat detail laporan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}