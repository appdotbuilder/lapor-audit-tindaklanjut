import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, X } from 'lucide-react';
// Simple date formatting function
const formatDate = (date: Date) => {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
// Simple utility function for merging classes
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateFollowUpActionInput, FollowUpAction } from '../../../server/src/schema';

interface CreateFollowUpActionFormProps {
  reportId: number;
  onSuccess: (action: FollowUpAction) => void;
  onCancel: () => void;
}

export function CreateFollowUpActionForm({ reportId, onSuccess, onCancel }: CreateFollowUpActionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFollowUpActionInput>({
    report_id: reportId,
    action_description: '',
    assigned_to: null,
    due_date: null,
    notes: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createFollowUpAction.mutate(formData);
      onSuccess(response);
      
      // Reset form
      setFormData({
        report_id: reportId,
        action_description: '',
        assigned_to: null,
        due_date: null,
        notes: null
      });
    } catch (error) {
      console.error('Failed to create follow-up action:', error);
      alert('Gagal membuat tindak lanjut. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="action_description" className="text-sm font-medium">
          📋 Deskripsi Aksi *
        </Label>
        <Textarea
          id="action_description"
          value={formData.action_description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ ...prev, action_description: e.target.value }))
          }
          placeholder="Masukkan deskripsi aksi yang perlu ditindaklanjuti..."
          required
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assigned_to" className="text-sm font-medium">
            👤 Ditugaskan Kepada
          </Label>
          <Input
            id="assigned_to"
            value={formData.assigned_to || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ 
                ...prev, 
                assigned_to: e.target.value || null 
              }))
            }
            placeholder="Nama atau tim yang ditugaskan..."
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">📅 Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !formData.due_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? (
                  formatDate(formData.due_date)
                ) : (
                  "Pilih tanggal..."
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.due_date || undefined}
                onSelect={(date: Date | undefined) =>
                  setFormData(prev => ({ ...prev, due_date: date || null }))
                }
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium">
          📝 Catatan
        </Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ 
              ...prev, 
              notes: e.target.value || null 
            }))
          }
          placeholder="Catatan tambahan (opsional)..."
          rows={2}
          className="mt-1"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}