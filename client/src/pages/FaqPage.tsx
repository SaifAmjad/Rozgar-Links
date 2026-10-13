import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { ButtonLink } from '../components/ui/ButtonLink';

const questions = [
  {
    answer:
      'No. Rozgar Links is an independent assistance service. It does not guarantee interviews, visas, offers or employment.',
    question: 'Does Rozgar Links guarantee a job?',
  },
  {
    answer:
      'Not yet. The jobs directory will begin with fictional examples that are visibly marked “Sample listing.” Real records require a genuine authorized source and original link.',
    question: 'Are the current jobs live vacancies?',
  },
  {
    answer:
      'No. Payment details and collection remain a non-operational demonstration until licensing, legal, privacy and fee-policy approvals are complete.',
    question: 'Can I pay a service fee now?',
  },
  {
    answer:
      'No. Uploads are not active in this milestone. When submission is implemented, documents will be processed privately and emailed to the configured administrator without permanent applicant storage.',
    question: 'Should I send my CV or identity documents now?',
  },
  {
    answer:
      'No partnership or endorsement is claimed. Rozgar Links is independent from GulfTalent, NaukriGulf and any employer unless written authorization is later documented.',
    question: 'Is Rozgar Links affiliated with external job boards?',
  },
];

export function FaqPage() {
  return (
    <>
      <PageIntro
        actions={<ButtonLink to="/contact">Contact information</ButtonLink>}
        description="Straight answers about the service, listings, fees, documents and current launch status."
        eyebrow="Help centre"
        title="Frequently asked questions"
      />
      <PageContainer className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          {questions.map((item) => (
            <details className="group rounded-xl border bg-bg p-5 shadow-soft" key={item.question}>
              <summary className="min-h-11 cursor-pointer content-center font-bold text-primary marker:text-brand-green">
                {item.question}
              </summary>
              <p className="mt-3 border-t pt-4 leading-7 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
