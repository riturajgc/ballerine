import React from 'react';
import {
  CalendarDays,
  Mail,
  Phone,
  User,
  MapPin,
  CreditCard,
  Building,
  FileText,
  Hash,
} from 'lucide-react';
import { Card } from '@/common/components/atoms/Card/Card';
import { Badge } from '@ballerine/ui';

interface RenderObjectProps {
  obj: Record<string, any>;
  showLabel?: boolean;
}

type IconMapping = {
  [key: string]: React.ReactNode;
};

const getIconForKey = (key: string): React.ReactNode => {
  const iconMapping: IconMapping = {
    email: <Mail className="h-4 w-4 text-gray-500" />,
    phone: <Phone className="h-4 w-4 text-gray-500" />,
    date: <CalendarDays className="h-4 w-4 text-gray-500" />,
    name: <User className="h-4 w-4 text-gray-500" />,
    address: <MapPin className="h-4 w-4 text-gray-500" />,
    payment: <CreditCard className="h-4 w-4 text-gray-500" />,
    company: <Building className="h-4 w-4 text-gray-500" />,
    document: <FileText className="h-4 w-4 text-gray-500" />,
    id: <Hash className="h-4 w-4 text-gray-500" />,
  };

  // Check for partial matches in the key
  const matchingKey = Object.keys(iconMapping).find(mappingKey =>
    key.toLowerCase().includes(mappingKey.toLowerCase()),
  );

  return matchingKey ? iconMapping[matchingKey] : <FileText className="h-4 w-4 text-gray-500" />;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getValueColor = (value: any): string => {
  if (value === null || value === undefined) return 'text-gray-400';
  if (typeof value === 'boolean') return value ? 'text-green-600' : 'text-red-600';
  return 'text-gray-700';
};

const camelToTitleCase = (input: string): string => {
  const result = input
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  return result.replace(/\s+/g, ' ');
};

const RenderObject: React.FC<RenderObjectProps> = ({ obj, showLabel = true }) => {
  return (
    <Card className="w-full">
      <div className="grid gap-4 p-6">
        {Object.entries(obj).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) return null;

          const formattedValue = formatValue(value);
          const valueColor = getValueColor(value);
          const icon = getIconForKey(key);

          return (
            <div key={key} className="flex items-start space-x-4">
              <div className="flex-shrink-0 pt-1">{icon}</div>
              <div className="flex-grow space-y-1">
                {showLabel && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      {camelToTitleCase(key)}
                    </span>
                    {typeof value === 'boolean' && (
                      <Badge variant={value ? 'success' : 'destructive'} className="text-xs">
                        {value ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                )}
                <div className={`font-medium ${valueColor}`}>{formattedValue}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RenderObject;
