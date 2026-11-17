import { WhatsAppIcon } from './ui/WhatsAppIcon';

import { useLanguage } from '../i18n/useLanguage';
import { whatsAppChatUrl } from '../lib/contact';

export function WhatsAppButton() {
  const { t } = useLanguage();
  const label = t('Chat with Rozgar Links on WhatsApp (opens in a new tab)');

  return (
    <a
      aria-label={label}
      className="fixed z-40 grid size-14 place-items-center rounded-full border border-brand-green/25 bg-bg text-brand-green shadow-soft transition-colors hover:border-brand-green hover:bg-surface sm:size-16"
      href={whatsAppChatUrl}
      rel="noopener noreferrer"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
      }}
      target="_blank"
      title={label}
    >
      <WhatsAppIcon className="size-8 sm:size-9" />
    </a>
  );
}
