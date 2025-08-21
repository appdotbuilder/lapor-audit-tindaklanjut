import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Search, Filter, Download, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { CreateReportForm } from '@/components/CreateReportForm';
import { EditReportDialog } from '@/components/EditReportDialog';
import { ReportDetailsDialog } from '@/components/ReportDetailsDialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Report, GetReportsInput } from '../../../server/src/schema';

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GetReportsInput>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await trpc.getReports.query(filters);
      setReports(result);
    } catch (error) {
      console.error('Failed to load reports:', error);
      setError('Gagal memuat laporan. Menggunakan data demo.');
      
      // Demo data when backend is not ready
      setReports([
        {
          id: 1,
          title: 'Laporan Pengawasan Keuangan Q1 2024',
          description: 'Pemeriksaan keuangan triwulan pertama tahun 2024 mencakup evaluasi proses akuntansi, pengendalian internal, dan kepatuhan terhadap regulasi keuangan.',
          report_type: 'oversight' as const,
          status: 'completed' as const,
          file_url: '/files/laporan-q1-2024.pdf',
          file_name: 'laporan-q1-2024.pdf',
          uploaded_by: 'Ahmad Wijaya',
          created_at: new Date('2024-03-15T09:30:00'),
          updated_at: new Date('2024-03-20T14:45:00')
        },
        {
          id: 2,
          title: 'Audit Internal Sistem IT',
          description: 'Evaluasi menyeluruh terhadap keamanan sistem informasi, infrastruktur IT, dan prosedur backup data organisasi.',
          report_type: 'audit' as const,
          status: 'in_progress' as const,
          file_url: null,
          file_name: null,
          uploaded_by: 'Sari Indah',
          created_at: new Date('2024-03-10T11:15:00'),
          updated_at: new Date('2024-03-18T16:20:00')
        },
        {
          id: 3,
          title: 'Review Proses Pengadaan Barang',
          description: 'Tinjauan terhadap prosedur pengadaan barang dan jasa untuk memastikan transparansi dan efisiensi dalam proses procurement.',
          report_type: 'review' as const,
          status: 'pending' as const,
          file_url: null,
          file_name: null,
          uploaded_by: 'Budi Santoso',
          created_at: new Date('2024-03-25T08:45:00'),
          updated_at: new Date('2024-03-25T08:45:00')
        },
        {
          id: 4,
          title: 'Pengawasan Implementasi Kebijakan SDM',
          description: null,
          report_type: 'oversight' as const,
          status: 'completed' as const,
          file_url: '/files/pengawasan-sdm.pdf',
          file_name: 'pengawasan-sdm.pdf',
          uploaded_by: 'Lisa Pratiwi',
          created_at: new Date('2024-02-28T13:20:00'),
          updated_at: new Date('2024-03-05T10:30:00')
        },
        {
          id: 5,
          title: 'Audit Operasional Divisi Marketing',
          description: 'Pemeriksaan efektivitas operasional dan strategi pemasaran untuk mengidentifikasi peluang peningkatan kinerja.',
          report_type: 'audit' as const,
          status: 'in_progress' as const,
          file_url: null,
          file_name: null,
          uploaded_by: 'Eko Prasetyo',
          created_at: new Date('2024-03-12T14:10:00'),
          updated_at: new Date('2024-03-22T09:15:00')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Filter reports based on search term
  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateSuccess = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);
    setShowCreateDialog(false);
  };

  const handleEditSuccess = (updatedReport: Report) => {
    setReports(prev => prev.map(report => 
      report.id === updatedReport.id ? updatedReport : report
    ));
    setShowEditDialog(false);
    setSelectedReport(null);
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    
    try {
      await trpc.deleteReport.mutate({ id: reportId });
      setReports(prev => prev.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Gagal menghapus laporan. Silakan coba lagi.');
    }
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📋 Manajemen Laporan</h2>
          <p className="text-gray-600 mt-1">Kelola laporan pengawasan, audit, dan review</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Laporan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>📝 Buat Laporan Baru</DialogTitle>
              <DialogDescription>
                Unggah laporan pengawasan, audit, atau review baru
              </DialogDescription>
            </DialogHeader>
            <CreateReportForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
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
                  placeholder="Cari laporan..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filters.report_type || ''}
                onValueChange={(value: string) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    report_type: value ? (value as 'oversight' | 'audit' | 'review') : undefined 
                  }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Jenis</SelectItem>
                  <SelectItem value="oversight">👁️ Pengawasan</SelectItem>
                  <SelectItem value="audit">🔍 Audit</SelectItem>
                  <SelectItem value="review">📊 Review</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || ''}
                onValueChange={(value: string) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    status: value ? (value as 'pending' | 'in_progress' | 'completed') : undefined 
                  }))
                }
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="pending">⏸️ Pending</SelectItem>
                  <SelectItem value="in_progress">⏳ Berjalan</SelectItem>
                  <SelectItem value="completed">✅ Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Menampilkan {filteredReports.length} dari {reports.length} laporan
            </span>
            {(filters.report_type || filters.status || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({});
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

      {/* Reports List */}
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
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filters.report_type || filters.status ? 'Tidak Ada Hasil' : 'Belum Ada Laporan'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filters.report_type || filters.status
                ? 'Tidak ada laporan yang sesuai dengan kriteria pencarian Anda'
                : 'Mulai dengan mengunggah laporan pertama Anda'}
            </p>
            {!(searchTerm || filters.report_type || filters.status) && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Laporan Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report: Report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {report.title}
                      </h3>
                      {report.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {report.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(report.report_type)}
                      {getStatusBadge(report.status)}
                      {report.file_name && (
                        <Badge variant="outline" className="text-xs">
                          📎 {report.file_name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>👤 {report.uploaded_by}</span>
                      <span>📅 {report.created_at.toLocaleDateString('id-ID')}</span>
                      {report.updated_at.getTime() !== report.created_at.getTime() && (
                        <span>🔄 Diperbarui {report.updated_at.toLocaleDateString('id-ID')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Lihat
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    {report.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // In real app, this would download the file
                          alert('Fitur unduh akan tersedia setelah backend diimplementasi');
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Unduh
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {selectedReport && (
        <>
          <EditReportDialog
            report={selectedReport}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={handleEditSuccess}
          />
          
          <ReportDetailsDialog
            report={selectedReport}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
          />
        </>
      )}
    </div>
  );
}