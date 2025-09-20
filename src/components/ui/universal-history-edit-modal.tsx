import React, { ReactNode } from 'react';
import { FormModal } from '@/components/ui/universal-modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Zap, Clock } from 'lucide-react';

export interface UniversalEditField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'datetime-local' | 'textarea' | 'checkbox' | 'custom';
  value: any;
  onChange: (value: any) => void;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  rows?: number;
  customComponent?: ReactNode;
}

export interface UniversalEditPreview {
  label: string;
  value: string | number;
  format?: (value: any) => string;
}

interface UniversalHistoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  fields: UniversalEditField[];
  preview?: UniversalEditPreview[];
  recalculateOption?: {
    enabled: boolean;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  editReasonField?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  warningMessage?: {
    title: string;
    description: string;
    icon?: ReactNode;
  };
  isSaving?: boolean;
  saveDisabled?: boolean;
  children?: ReactNode;
}

export const UniversalHistoryEditModal: React.FC<UniversalHistoryEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  fields,
  preview,
  recalculateOption,
  editReasonField,
  warningMessage,
  isSaving = false,
  saveDisabled = false,
  children,
}) => {
  const renderField = (field: UniversalEditField) => {
    const baseProps = {
      id: field.key,
      required: field.required,
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={field.value}
            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
          />
        );
      
      case 'datetime-local':
        return (
          <Input
            {...baseProps}
            type="datetime-local"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            rows={field.rows || 3}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={field.key} className="text-sm">
              {field.label}
            </Label>
          </div>
        );
      
      case 'custom':
        return field.customComponent || null;
      
      default:
        return (
          <Input
            {...baseProps}
            type="text"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      title={title}
      saveText="Save Changes"
      isSaving={isSaving}
      saveDisabled={saveDisabled}
    >
      <div className="space-y-4">
        {recalculateOption && (
          <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-2">
            <Zap className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1 text-foreground">{recalculateOption.label}</p>
              <label className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={recalculateOption.checked}
                  onChange={(e) => recalculateOption.onChange(e.target.checked)}
                  className="rounded accent-accent"
                />
                <span className="text-muted-foreground">{recalculateOption.description}</span>
              </label>
            </div>
          </div>
        )}

        {warningMessage && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
            {warningMessage.icon || <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />}
            <div className="text-sm">
              <p className="font-medium mb-1 text-foreground">{warningMessage.title}</p>
              <p className="text-muted-foreground">{warningMessage.description}</p>
            </div>
          </div>
        )}

        {/* Render fields based on their layout preference */}
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className={field.type === 'checkbox' || field.type === 'custom' ? '' : 'space-y-2'}>
              {field.type !== 'checkbox' && field.type !== 'custom' && (
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>

        {/* Preview Section */}
        {preview && preview.length > 0 && (
          <div className="bg-muted/30 border border-border rounded-lg p-3">
            <div className="text-sm space-y-1">
              {preview.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <span className="font-medium text-foreground">
                    {item.format ? item.format(item.value) : item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Reason Field */}
        {editReasonField && (
          <div className="space-y-2">
            <Label htmlFor="edit-reason">Edit Reason (Optional)</Label>
            <Textarea
              id="edit-reason"
              placeholder={editReasonField.placeholder || "e.g., Correction needed"}
              value={editReasonField.value}
              onChange={(e) => editReasonField.onChange(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* Custom content */}
        {children}
      </div>
    </FormModal>
  );
};

// Helper function to format datetime for input fields
export const formatForDateTimeInput = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

// Helper function to format duration
export const formatDuration = (minutes: number) => {
  if (minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Helper function to format hours duration for fasting
export const formatFastingDuration = (hours: number) => {
  if (hours <= 0) return '0h';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
};