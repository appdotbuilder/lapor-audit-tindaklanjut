import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, Clock, CheckSquare, Edit, Trash2, AlertTriangle, Calendar, User } from 'lucide-react';
import { EditFollowUpActionDialog } from '@/components/EditFollowUpActionDialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { FollowUpAction } from '../../../server/src/schema';

// Extended type to include report information for better display
interface FollowUpActionWithReport extends FollowUpAction {
  report_title?: string;
}

export function FollowUpActionsPage() {
  const [followUpActions, setFollowUpActions] = useState<FollowUpActionWithReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<FollowUpAction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadFollowUpActions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await trpc.getPendingFollowUpActions.query();
      setFollowUpActions(result as FollowUpActionWithReport[]);
    } catch (error) {
      console.error('Failed to load follow-up actions:', error);
      setError('Gagal memuat tindak lanjut. Menggunakan data demo.');
      
      // Demo data when backend is not ready
      setFollowUpActions([
        {
          id: 1,
          report_id: 1,
          report_title: 'Laporan Pengawasan Keuangan Q1 2024',
          action_description: 'Implementasi rekomendasi sistem akuntansi baru untuk meningkatkan transparansi dan akurasi pelaporan keuangan',
          assigned_to: 'Tim IT',
          status: 'in_progress' as const,
          due_date: new Date('2024-04-15'),
          completion_date: null,
          notes: 'Progress 60% - sedang dalam tahap pengembangan modul akuntansi. Diperlukan koordinasi dengan divisi keuangan.',
          created_at: new Date('2024-03-20T09:30:00'),
          updated_at: new Date('2024-03-28T14:15:00')
        },
        {
          id: 2,
          report_id: 1,
          report_title: 'Laporan Pengawasan Keuangan Q1 2024',
          action_description: 'Pelatihan staff keuangan untuk sistem akuntansi baru',
          assigned_to: 'HRD',
          status: 'not_started' as const,
          due_date: new Date('2024-05-01'),
          completion_date: null,
          notes: null,
          created_at: new Date('2024-03-20T09:45:00'),
          updated_at: new Date('2024-03-20T09:45:00')
        },
        {
          id: 3,
          report_id: 2,
          report_title: 'Audit Internal Sistem IT',
          action_description: 'Upgrade keamanan server database dan implementasi backup otomatis',
          assigned_to: 'Tim Keamanan',
          status: 'completed' as const,
          due_date: new Date('2024-04-01'),
          completion_date: new Date('2024-03-28'),
          notes: 'Keamanan database telah ditingkatkan dengan enkripsi tambahan dan sistem backup otomatis setiap hari.',
          created_at: new Date('2024-03-18T11:20:00'),
          updated_at: new Date('2024-03-28T16:45:00')
        },
        {
          id: 4,
          report_id: 3,
          report_title: 'Review Proses Pengadaan Barang',
          action_description: 'Revisi SOP pengadaan barang untuk meningkatkan efisiensi dan transparansi',
          assigned_to: 'Tim Procurement',
          status: 'in_progress' as const,
          due_date: new Date('2024-04-20'),
          completion_date: null,
          notes: 'Draft SOP baru sedang dalam review oleh manajemen. Diperkirakan selesai minggu depan.',
          created_at: new Date('2024-03-25T08:15:00'),
          updated_at: new Date('2024-03-29T10:30:00')
        },
        {
          id: 5,
          report_id: 2,
          report_title: 'Audit Internal Sistem IT',
          action_description: 'Pelatihan cybersecurity untuk seluruh karyawan',
          assigned_to: 'Tim IT & HRD',
          status: 'not_started' as const,
          due_date: new Date('2024-04-30'),
          completion_date: null,
          notes: 'Menunggu persetujuan budget untuk mengundang trainer eksternal.',
          created_at: new Date('2024-03-18T14:45:00'),
          updated_at: new Date('2024-03-25T09:20:00')
        },
        {
          id: 6,
          report_id: 4,
          report_title: 'Pengawasan Implementasi Kebijakan SDM',
          action_description: 'Update handbook karyawan sesuai kebijakan SDM terbaru',
          assigned_to: 'HRD',
          status: 'completed' as const,
          due_date: new Date('2024-03-30'),
          completion_date: new Date('2024-03-29'),
          notes: 'Handbook karyawan telah diperbarui dan didistribusikan ke seluruh divisi.',
          created_at: new Date('2024-03-05T13:10:00'),
          updated_at: new Date('2024-03-29T15:20:00')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFollowUpActions();
  }, [loadFollowUpActions]);

  // Filter actions based on search term and status
  const filteredActions = followUpActions.filter(action => {
    const matchesSearch = 
      action.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.assigned_to && action.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (action.report_title && action.report_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || action.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group actions by status for better organization
  const groupedActions = {
    overdue: filteredActions.filter(action => 
      action.due_date && 
      action.status !== 'completed' && 
      new Date(action.due_date) < new Date()
    ),
    in_progress: filteredActions.filter(action => action.status === 'in_progress'),
    not_started: filteredActions.filter(action => action.status === 'not_started'),
    completed: filteredActions.filter(action => action.status === 'completed')
  };

  const handleEditSuccess = (updatedAction: FollowUpAction) => {
    setFollowUpActions(prev => prev.map(action => 
      action.id === updatedAction.id 
        ? { ...action, ...updatedAction }
        : action
    ));
    setShowEditDialog(false);
    setSelectedAction(null);
  };

  const handleDelete = async (actionId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tindak lanjut ini?')) return;
    
    try {
      await trpc.deleteFollowUpAction.mutate({ id: actionId });
      setFollowUpActions(prev => prev.filter(action => action.id !== actionId));
    } catch (error) {
      console.error('Failed to delete follow-up action:', error);
      alert('Gagal menghapus tindak lanjut. Silakan coba lagi.');
    }
  };

  const getStatusBadge = (status: FollowUpAction['status'], isOverdue = false) => {
    if (isOverdue) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">🚨 Terlambat</Badge>;
    }
    
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Selesai</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">🔄 Berjalan</Badge>;
      case 'not_started':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">⏸️ Belum Mulai</Badge>;
    }
  };

  const getPriorityColor = (action: FollowUpActionWithReport) => {
    if (action.due_date && action.status !== 'completed' && new Date(action.due_date) < new Date()) {
      return 'border-l-red-500';
    }
    if (action.status === 'in_progress') {
      return 'border-l-blue-500';
    }
    if (action.status === 'completed') {
      return 'border-l-green-500';
    }
    return 'border-l-gray-300';
  };

  const ActionCard = ({ action }: { action: FollowUpActionWithReport }) => {
    const isOverdue = action.due_date && action.status !== 'completed' && new Date(action.due_date) < new Date();
    
    return (
      <Card className={`hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(action)}`}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
                  {action.action_description}
                </h4>
                {action.report_title && (
                  <p className="text-sm text-blue-600 mb-2">
                    📋 {action.report_title}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(action.status, !!isOverdue)}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAction(action);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(action.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Hapus
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{action.assigned_to || 'Belum ditugaskan'}</span>
              </div>
              {action.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Deadline: {action.due_date.toLocaleDateString('id-ID')}</span>
                </div>
              )}
              {action.completion_date && (
                <div className="flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">⏰ Manajemen Tindak Lanjut</h2>
        <p className="text-gray-600 mt-1">Pantau dan kelola semua aksi tindak lanjut dari laporan</p>
      </div>

      {error && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">🔍 Pencarian & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari tindak lanjut..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="not_started">⏸️ Belum Mulai</SelectItem>
                <SelectItem value="in_progress">🔄 Berjalan</SelectItem>
                <SelectItem value="completed">✅ Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Menampilkan {filteredActions.length} dari {followUpActions.length} tindak lanjut
            </span>
            {(statusFilter || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">🚨 Terlambat</p>
                <p className="text-2xl font-bold">{groupedActions.overdue.length}</p>
              </div>
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">🔄 Berjalan</p>
                <p className="text-2xl font-bold">{groupedActions.in_progress.length}</p>
              </div>
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">⏸️ Belum Mulai</p>
                <p className="text-2xl font-bold">{groupedActions.not_started.length}</p>
              </div>
              <Filter className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">✅ Selesai</p>
                <p className="text-2xl font-bold">{groupedActions.completed.length}</p>
              </div>
              <CheckSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredActions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter ? 'Tidak Ada Hasil' : 'Belum Ada Tindak Lanjut'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter
                ? 'Tidak ada tindak lanjut yang sesuai dengan kriteria pencarian Anda'
                : 'Tindak lanjut akan muncul di sini setelah laporan dibuat'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Overdue Actions (Priority) */}
          {groupedActions.overdue.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-xl font-semibold text-red-600">🚨 Terlambat ({groupedActions.overdue.length})</h3>
              </div>
              <div className="grid gap-4">
                {groupedActions.overdue.map((action: FollowUpActionWithReport) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Actions */}
          {groupedActions.in_progress.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-blue-600">🔄 Sedang Berjalan ({groupedActions.in_progress.length})</h3>
              </div>
              <div className="grid gap-4">
                {groupedActions.in_progress.map((action: FollowUpActionWithReport) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}

          {/* Not Started Actions */}
          {groupedActions.not_started.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-xl font-semibold text-gray-600">⏸️ Belum Dimulai ({groupedActions.not_started.length})</h3>
              </div>
              <div className="grid gap-4">
                {groupedActions.not_started.map((action: FollowUpActionWithReport) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Actions */}
          {groupedActions.completed.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-semibold text-green-600">✅ Selesai ({groupedActions.completed.length})</h3>
              </div>
              <div className="grid gap-4">
                {groupedActions.completed.map((action: FollowUpActionWithReport) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {selectedAction && (
        <EditFollowUpActionDialog
          action={selectedAction}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}