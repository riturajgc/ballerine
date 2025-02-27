import { CopySvg } from '@/common/components/atoms/icons';
import { Button } from '@/common/components/atoms/Button/Button';
import { ComponentProps, FunctionComponent } from 'react';
import { copyToClipboard } from '@/common/utils/copy-to-clipboard/copy-to-clipboard';
import { ctw } from '@ballerine/ui';

interface ICopyToClipboardProps extends ComponentProps<typeof Button> {
  textToCopy: string;
}

export const CopyToClipboardButton: FunctionComponent<ICopyToClipboardProps> = ({
  textToCopy,
  className,
  disabled,
  ...props
}) => {
  return (
    <Button
      variant={'ghost'}
      size={'icon'}
      onClick={async event => {
        event.preventDefault();
        await copyToClipboard(textToCopy)();
      }}
      className={ctw(
        `h-[unset] w-[unset] p-1 opacity-80 hover:bg-transparent hover:opacity-100`,
        {
          '!bg-transparent opacity-50': disabled,
        },
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <CopySvg className={`d-4`} />
    </Button>
  );
};
