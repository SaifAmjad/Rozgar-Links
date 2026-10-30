import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { JobsDirectory } from '../features/jobs/JobsDirectory';
import { useLanguage } from '../i18n/useLanguage';

export function JobsPage() {
  const { t } = useLanguage();

  return (
    <>
      <PageIntro
        description={t(
          'Search 64 occupations in English or Urdu and compare indicative monthly salary ranges.',
        )}
        eyebrow={t('GCC occupation directory')}
        title={t('Find the right occupation')}
      />
      <PageContainer className="py-8 sm:py-12 lg:py-16">
        <JobsDirectory />
      </PageContainer>
    </>
  );
}
