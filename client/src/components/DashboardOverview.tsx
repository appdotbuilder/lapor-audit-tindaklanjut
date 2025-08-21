import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Report, FollowUpAction } from '../../../server/src/schema';

export function DashboardOverview() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingActions, setPendingActions] = useState<FollowUpAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load reports and pending follow-up actions
      const [reportsResult, pendingResult] = await Promise.all([
        trpc.getReports.query(),
        trpc.getPendingFollowUpActions.query()
      ]);
      
      setReports(reportsResult);
      setPendingActions(pendingResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Gagal memuat data dashboard. Menggunakan data demo.');
      
      // Set demo data for better UX when backend is not ready
      setReports([
        {
          id: 1,
          title: 'Laporan Pengawasan Keuangan Q1 2024',
          description: 'Pemeriksaan keuangan triwulan pertama',
          report_type: 'oversight' as const,
          status: 'completed' as const,
          file_url: null,
          file_name: 'laporan-q1-2024.pdf',
          uploaded_by: 'Ahmad Wijaya',
          created_at: new Date('2024-03-15'),
          updated_at: new Date('2024-03-20')
        },
        {
          id: 2,
          title: 'Audit Internal Sistem IT',
          description: 'Evaluasi keamanan dan efisiensi sistem informasi',
          report_type: 'audit' as const,
          status: 'in_progress' as const,
          file_url: null,
          file_name: null,
          uploaded_by: 'Sari Indah',
          created_at: new Date('2024-03-10'),
          updated_at: new Date('2024-03-18')
        },
        {
          id: 3,
          title: 'Review Proses Pengadaan',
          description: null,
          report_type: 'review' as const,
          status: 'pending' as const,
          file_url: null,
          file_name: null,
          uploaded_by: 'Budi Santoso',
          created_at: new Date('2024-03-25'),
          updated_at: new Date('2024-03-25')
        }
      ]);
      
      setPendingActions([
        {
          id: 1,
          report_id: 1,
          action_description: 'Implementasi rekomendasi sistem akuntansi',
          assigned_to: 'Tim IT',
          status: 'in_progress' as const,
          due_date: new Date('2024-04-15'),
          completion_date: null,
          notes: 'Progress 60% - sedang pengembangan modul',
          created_at: new Date('2024-03-20'),
          updated_at: new Date('2024-03-28')
        },
        {
          id: 2,
          report_id: 2,
          action_description: 'Perbaikan keamanan database',
          assigned_to: 'Tim Keamanan',
          status: 'not_started' as const,
          due_date: new Date('2024-04-30'),
          completion_date: null,
          notes: null,
          created_at: new Date('2024-03-18'),
          updated_at: new Date('2024-03-18')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate statistics
  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'completed').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  
  const totalActions = pendingActions.length;
  const completedActions = pendingActions.filter(a => a.status === 'completed').length;
  const inProgressActions = pendingActions.filter(a => a.status === 'in_progress').length;
  const notStartedActions = pendingActions.filter(a => a.status === 'not_started').length;
  
  const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
  const actionCompletionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Get overdue actions
  const overdueActions = pendingActions.filter(action => 
    action.due_date && action.status !== 'completed' && new Date(action.due_date) < new Date()
  );

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-blue-100">
              📈 {completedReports} selesai, {inProgressReports} berjalan, {pendingReports} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Penyelesaian</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2 bg-green-200" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tindak Lanjut Aktif</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActions}</div>
            <p className="text-xs text-orange-100">
              ⚡ {inProgressActions} berjalan, {notStartedActions} belum dimulai
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueActions.length}</div>
            <p className="text-xs text-red-100">
              🚨 Aksi yang melewati deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports and Pending Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              📋 Laporan Terbaru
            </CardTitle>
            <CardDescription>
              {reports.length > 0 ? 'Laporan yang baru diunggah' : 'Belum ada laporan'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada laporan yang diunggah</p>
            ) : (
              reports.slice(0, 3).map((report: Report) => (
                <div key={report.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{report.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      📤 Oleh {report.uploaded_by} • {report.created_at.toLocaleDateString('id-ID')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={
                        report.report_type === 'oversight' ? 'default' :
                        report.report_type === 'audit' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {report.report_type === 'oversight' ? '👁️ Pengawasan' :
                         report.report_type === 'audit' ? '🔍 Audit' : '📊 Review'}
                      </Badge>
                      <Badge variant={
                        report.status === 'completed' ? 'default' :
                        report.status === 'in_progress' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {report.status === 'completed' ? '✅ Selesai' :
                         report.status === 'in_progress' ? '⏳ Berjalan' : '⏸️ Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              ⏰ Tindak Lanjut Pending
            </CardTitle>
            <CardDescription>
              {pendingActions.length > 0 ? 'Aksi yang perlu ditindaklanjuti' : 'Semua tindak lanjut selesai'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingActions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">🎉 Semua tindak lanjut sudah selesai!</p>
            ) : (
              pendingActions.slice(0, 3).map((action: FollowUpAction) => (
                <div key={action.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{action.action_description}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      👤 {action.assigned_to || 'Belum ditugaskan'}
                      {action.due_date && (
                        <>
                          {' '} • 📅 {action.due_date.toLocaleDateString('id-ID')}
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={
                        action.status === 'completed' ? 'default' :
                        action.status === 'in_progress' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {action.status === 'completed' ? '✅ Selesai' :
                         action.status === 'in_progress' ? '🔄 Berjalan' : '⏸️ Belum Mulai'}
                      </Badge>
                      {action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed' && (
                        <Badge variant="destructive" className="text-xs">
                          🚨 Terlambat
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Completion Progress */}
      {totalActions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              📊 Progress Tindak Lanjut
            </CardTitle>
            <CardDescription>
              Tingkat penyelesaian aksi tindak lanjut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Penyelesaian Keseluruhan</span>
                  <span className="font-semibold">{actionCompletionRate}%</span>
                </div>
                <Progress value={actionCompletionRate} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{completedActions}</div>
                  <div className="text-xs text-gray-600">✅ Selesai</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{inProgressActions}</div>
                  <div className="text-xs text-gray-600">🔄 Berjalan</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">{notStartedActions}</div>
                  <div className="text-xs text-gray-600">⏸️ Belum Mulai</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}