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
      'The directory contains opportunities collected by Rozgar Links. Availability and requirements can change, so confirm the current details before applying.',
    question: 'Are the current jobs live vacancies?',
  },
  {
    answer:
      'No. Payment details and collection remain a non-operational demonstration until licensing, legal, privacy and fee-policy approvals are complete.',
    question: 'Can I pay a service fee now?',
  },
  {
    answer:
      'Documents are processed in memory and emailed to the configured administrator only after secure server validation. During this demonstration stage, use test files only; applicant data is not stored in the application database.',
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
