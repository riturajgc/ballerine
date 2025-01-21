import React from 'react';
import {
  Mail,
  Phone,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Building,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { TextArea } from '@ballerine/ui';
import { Select } from '@/common/components/atoms/Select/Select';
import { SelectTrigger } from '@/common/components/atoms/Select/Select.Trigger';
import { SelectValue } from '@/common/components/atoms/Select/Select.Value';
import { SelectContent } from '@/common/components/atoms/Select/Select.Content';
import { SelectItem } from '@/common/components/atoms/Select/Select.Item';
import { Switch } from '@/common/components/atoms/Switch';
import { Label } from '@/common/components/atoms/Label/Label';
import { Input } from '@/common/components/atoms/Input/Input';
import { statesToTitleCaseData } from '../Case/consts';

interface RenderFormProps {
  obj: Record<string, any>;
  onChange: (key: string, value: string | boolean | number) => void;
  errors?: Record<string, string>;
  setCurrentState: React.Dispatch<React.SetStateAction<string>>;
}

interface FieldConfig {
  type: string;
  validation?: RegExp;
  errorMessage?: string;
  options?: string[];
  min?: number;
  max?: number;
}

type FieldConfigs = {
  [key: string]: FieldConfig;
};

const getFieldConfig = (key: string, value: any): FieldConfig => {
  const configs: FieldConfigs = {
    email: {
      type: 'email',
      validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMessage: 'Please enter a valid email address',
    },
    phoneNumber: {
      type: 'tel',
      validation: /^\+?[\d\s-]{10,}$/,
      errorMessage: 'Please enter a valid phone number',
    },
    date: {
      type: 'date',
    },
    age: {
      type: 'number',
      min: 0,
      max: 150,
    },
    password: {
      type: 'password',
      validation: /^.{8,}$/,
      errorMessage: 'Password must be at least 8 characters long',
    },
    description: {
      type: 'textarea',
    },
    status: {
      type: 'select',
      options: ['Active', 'Pending', 'Inactive'],
    },
    enabled: {
      type: 'switch',
    },
    state: {
      type: 'select',
      options: Object.keys(statesToTitleCaseData),
    },
  };

  // Check for exact match first
  if (configs[key]) return configs[key];

  // Check for partial matches in the key
  const matchingKey = Object.keys(configs).find(configKey =>
    key.toLowerCase().includes(configKey.toLowerCase()),
  );

  if (matchingKey) return configs[matchingKey];

  // Determine type based on value
  if (typeof value === 'boolean') return { type: 'switch' };
  if (typeof value === 'number') return { type: 'number' };
  if (typeof value === 'string' && value.length > 100) return { type: 'textarea' };

  return { type: 'text' };
};

const getIconForKey = (key: string) => {
  const iconMapping: Record<string, React.ReactNode> = {
    email: <Mail className="h-4 w-4" />,
    phoneNumber: <Phone className="h-4 w-4" />,
    phone: <Phone className="h-4 w-4" />,
    date: <Calendar className="h-4 w-4" />,
    name: <User className="h-4 w-4" />,
    address: <MapPin className="h-4 w-4" />,
    payment: <CreditCard className="h-4 w-4" />,
    company: <Building className="h-4 w-4" />,
    id: <Hash className="h-4 w-4" />,
    state: <MapPin className="h-4 w-4" />, // Example icon for state
  };

  const matchingKey = Object.keys(iconMapping).find(mappingKey =>
    key.toLowerCase().includes(mappingKey.toLowerCase()),
  );

  return matchingKey ? iconMapping[matchingKey] : null;
};

const camelToTitleCase = (input: string): string => {
  const result = input
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  return result.replace(/\s+/g, ' ');
};

const RenderForm: React.FC<RenderFormProps> = ({ obj, onChange, errors = {}, setCurrentState }) => {
  const renderField = (key: string, value: any, fieldConfig: FieldConfig) => {
    const commonProps = {
      id: key,
      name: key,
      'aria-label': camelToTitleCase(key),
      className: errors[key] ? 'border-red-500' : '',
    };

    switch (fieldConfig.type) {
      case 'textarea':
        return (
          <TextArea
            {...commonProps}
            value={value}
            onChange={e => onChange(key, e.target.value)}
            className={`w-full ${errors[key] ? 'border-red-500' : ''}`}
          />
        );

      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={value => {
              onChange(key, value);
              setCurrentState(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${camelToTitleCase(key)}`} />
            </SelectTrigger>
            <SelectContent className="z-[999]">
              {fieldConfig.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {statesToTitleCaseData[option] || ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={key}
              checked={Boolean(value)}
              onCheckedChange={checked => onChange(key, checked)}
            />
            <Label htmlFor={key}>{value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        );

      default:
        return (
          <div className="relative">
            {getIconForKey(key) && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {getIconForKey(key)}
              </div>
            )}
            <Input
              {...commonProps}
              type={fieldConfig.type}
              value={value}
              onChange={e => {
                const newValue =
                  fieldConfig.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                onChange(key, newValue);
              }}
              min={fieldConfig.min}
              max={fieldConfig.max}
              className={`${getIconForKey(key) ? 'pl-10' : ''} ${
                errors[key] ? 'border-red-500' : ''
              }`}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(obj).map(([key, value]) => {
        if (typeof value === 'object' && value !== null) return null;

        const fieldConfig = getFieldConfig(key, value);

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center space-x-1">
              <span>{camelToTitleCase(key)}</span>
              {errors[key] && <AlertCircle className="h-4 w-4 text-red-500" />}
            </Label>
            {renderField(key, value, fieldConfig)}
            {errors[key] && <p className="text-sm text-red-500">{errors[key]}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default RenderForm;
