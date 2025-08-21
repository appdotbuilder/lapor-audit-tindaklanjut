import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, CheckSquare, Clock } from 'lucide-react';
import { ReportsPage } from '@/components/ReportsPage';
import { FollowUpActionsPage } from '@/components/FollowUpActionsPage';
import { DashboardOverview } from '@/components/DashboardOverview';
import { trpc } from '@/utils/trpc';
import { useEffect, useState } from 'react';

function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Test connection to backend
  useEffect(() => {
    const testConnection = async () => {
      try {
        await trpc.healthcheck.query();
        setIsConnected(true);
      } catch (error) {
        console.error('Backend connection failed:', error);
        setIsConnected(false);
      }
    };
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Sistem Manajemen Laporan
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            📋 Kelola laporan pengawasan, audit, dan reviu dengan sistem tindak lanjut terintegrasi
          </p>
        </div>

        {/* Connection Status Alert */}
        {isConnected === false && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Peringatan:</strong> Backend menggunakan data demo. Handler database belum diimplementasi.
              Semua data yang ditampilkan adalah contoh dan tidak akan tersimpan secara permanen.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Navigation */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Laporan
            </TabsTrigger>
            <TabsTrigger value="followups" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tindak Lanjut
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsPage />
          </TabsContent>

          <TabsContent value="followups" className="space-y-6">
            <FollowUpActionsPage />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center mt-12 py-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            💼 Sistem Manajemen Laporan - Kelola laporan pengawasan dengan efisien
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;