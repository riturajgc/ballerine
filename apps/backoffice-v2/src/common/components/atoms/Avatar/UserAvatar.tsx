import { Avatar } from '@/common/components/atoms/Avatar';
import { createInitials } from '@/common/utils/create-initials/create-initials';
import { stringToRGB } from '@/common/utils/string-to-rgb/string-to-rgb';

interface UserAvatarProps {
  fullName: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar = ({ fullName, avatarUrl, size = 'sm', className }: UserAvatarProps) => {
  const initials = createInitials(fullName);
  const rgb = stringToRGB(fullName);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Avatar
      src={avatarUrl}
      className={`${sizeClasses[size]} ${className || ''}`}
      alt={`${fullName}'s avatar`}
      placeholder={initials}
      style={{
        color: `rgb(${rgb})`,
        backgroundColor: `rgba(${rgb}, 0.2)`,
      }}
    />
  );
};
