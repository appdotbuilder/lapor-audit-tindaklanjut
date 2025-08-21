import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateReportInput, Report } from '../../../server/src/schema';

interface CreateReportFormProps {
  onSuccess: (report: Report) => void;
}

export function CreateReportForm({ onSuccess }: CreateReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateReportInput>({
    title: '',
    description: null,
    report_type: 'oversight',
    file_url: null,
    file_name: null,
    uploaded_by: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createReport.mutate(formData);
      onSuccess(response);
      
      // Reset form
      setFormData({
        title: '',
        description: null,
        report_type: 'oversight',
        file_url: null,
        file_name: null,
        uploaded_by: ''
      });
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Gagal membuat laporan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload to server and get URL
      setFormData(prev => ({
        ...prev,
        file_name: file.name,
        file_url: `/uploads/${file.name}` // Demo URL
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            📝 Judul Laporan *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, title: e.target.value }))
            }
            placeholder="Masukkan judul laporan..."
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="report_type" className="text-sm font-medium">
            📋 Jenis Laporan *
          </Label>
          <Select
            value={formData.report_type}
            onValueChange={(value: 'oversight' | 'audit' | 'review') =>
              setFormData(prev => ({ ...prev, report_type: value }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oversight">👁️ Pengawasan</SelectItem>
              <SelectItem value="audit">🔍 Audit</SelectItem>
              <SelectItem value="review">📊 Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="uploaded_by" className="text-sm font-medium">
            👤 Diunggah Oleh *
          </Label>
          <Input
            id="uploaded_by"
            value={formData.uploaded_by}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, uploaded_by: e.target.value }))
            }
            placeholder="Nama pengunggah..."
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            📄 Deskripsi
          </Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData(prev => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            placeholder="Deskripsi laporan (opsional)..."
            rows={4}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">📎 File Laporan</Label>
          <Card className="mt-1 border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-6 text-center">
              {formData.file_name ? (
                <div className="space-y-2">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{formData.file_name}</p>
                  <p className="text-xs text-gray-600">File berhasil diunggah</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, file_name: null, file_url: null }))}
                  >
                    Hapus File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      Klik untuk unggah file
                    </p>
                    <p className="text-xs text-gray-600">
                      PDF, DOC, DOCX (Maks. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">Pilih File</span>
                    </Button>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Buat Laporan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}