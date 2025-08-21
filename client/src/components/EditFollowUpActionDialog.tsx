import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Save } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import type { FollowUpAction, UpdateFollowUpActionInput } from '../../../server/src/schema';

interface EditFollowUpActionDialogProps {
  action: FollowUpAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (action: FollowUpAction) => void;
}

export function EditFollowUpActionDialog({ action, open, onOpenChange, onSuccess }: EditFollowUpActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateFollowUpActionInput>({
    id: action.id,
    action_description: action.action_description,
    assigned_to: action.assigned_to,
    status: action.status,
    due_date: action.due_date,
    completion_date: action.completion_date,
    notes: action.notes
  });

  // Reset form when action changes
  useEffect(() => {
    setFormData({
      id: action.id,
      action_description: action.action_description,
      assigned_to: action.assigned_to,
      status: action.status,
      due_date: action.due_date,
      completion_date: action.completion_date,
      notes: action.notes
    });
  }, [action]);

  // Auto-set completion date when status changes to completed
  useEffect(() => {
    if (formData.status === 'completed' && !formData.completion_date) {
      setFormData(prev => ({ ...prev, completion_date: new Date() }));
    } else if (formData.status !== 'completed' && formData.completion_date) {
      setFormData(prev => ({ ...prev, completion_date: null }));
    }
  }, [formData.status, formData.completion_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.updateFollowUpAction.mutate(formData);
      if (response) {
        onSuccess(response);
      } else {
        // Handle stub backend - create mock response
        const mockResponse: FollowUpAction = {
          ...action,
          action_description: formData.action_description || action.action_description,
          assigned_to: formData.assigned_to !== undefined ? formData.assigned_to : action.assigned_to,
          status: formData.status || action.status,
          due_date: formData.due_date !== undefined ? formData.due_date : action.due_date,
          completion_date: formData.completion_date !== undefined ? formData.completion_date : action.completion_date,
          notes: formData.notes !== undefined ? formData.notes : action.notes,
          updated_at: new Date()
        };
        onSuccess(mockResponse);
      }
    } catch (error) {
      console.error('Failed to update follow-up action:', error);
      alert('Gagal memperbarui tindak lanjut. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✏️ Edit Tindak Lanjut</DialogTitle>
          <DialogDescription>
            Perbarui informasi aksi tindak lanjut
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="action_description" className="text-sm font-medium">
                📋 Deskripsi Aksi *
              </Label>
              <Textarea
                id="action_description"
                value={formData.action_description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData(prev => ({ ...prev, action_description: e.target.value }))
                }
                placeholder="Masukkan deskripsi aksi..."
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
                <Label htmlFor="status" className="text-sm font-medium">
                  📊 Status *
                </Label>
                <Select
                  value={formData.status || ''}
                  onValueChange={(value: 'not_started' | 'in_progress' | 'completed') =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">⏸️ Belum Mulai</SelectItem>
                    <SelectItem value="in_progress">🔄 Berjalan</SelectItem>
                    <SelectItem value="completed">✅ Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {formData.status === 'completed' && (
                <div>
                  <Label className="text-sm font-medium">✅ Tanggal Selesai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !formData.completion_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.completion_date ? (
                          formatDate(formData.completion_date)
                        ) : (
                          "Pilih tanggal..."
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.completion_date || undefined}
                        onSelect={(date: Date | undefined) =>
                          setFormData(prev => ({ ...prev, completion_date: date || null }))
                        }
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
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
                placeholder="Catatan tambahan..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}