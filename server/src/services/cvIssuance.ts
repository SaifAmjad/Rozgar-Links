import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createCvReference, signIssuedCv, verifyIssuedCv } from './cvIdentity.js';

// Admin-only: never called with an applicant's upload by the API.
export async function issueCv(input: Buffer, secret?: string, maximumBytes = 5 * 1024 * 1024) {
  if (input.length > maximumBytes || input.includes(Buffer.from('\n%RL-CV-V1:'))) {
    throw new Error('Use the original unsigned PDF within the upload limit.');
  }
  const document = await PDFDocument.load(input, { updateMetadata: false });
  if (document.getPageCount() < 1 || document.getPageCount() > 100)
    throw new Error('Use a PDF with 1–100 pages.');
  const now = new Date();
  const reference = createCvReference(now);
  const page = document.addPage([595, 842]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: 0, y: 700, width: 595, height: 142, color: rgb(0.043, 0.235, 0.451) });
  page.drawText('ROZGAR LINKS', { x: 42, y: 773, size: 26, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Official CV issuance record', {
    x: 42,
    y: 737,
    size: 16,
    font,
    color: rgb(1, 1, 1),
  });
  const lines = [
    reference,
    `Issued: ${now.toISOString()}`,
    '',
    'Keep this original PDF for future Rozgar Links applications.',
    'Upload/download copies are supported. Do not edit, print to PDF,',
    'optimize or re-save this file: those operations invalidate verification.',
    '',
    'This record confirms document issuance, not ownership or employment.',
    'No job, interview, visa or placement is guaranteed.',
  ];
  lines.forEach((line, index) =>
    page.drawText(line, {
      x: 42,
      y: 650 - index * 25,
      size: index === 0 ? 18 : 11,
      font: index === 0 ? bold : font,
      color: rgb(0.059, 0.09, 0.165),
    }),
  );
  const pdf = signIssuedCv(Buffer.from(await document.save()), reference, secret, now);
  if (pdf.length > maximumBytes)
    throw new Error(
      'The issued PDF exceeds the upload limit. Reduce the original PDF size before issuance.',
    );
  if (!verifyIssuedCv(pdf, secret, now)) throw new Error('Issuance self-check failed.');
  return { pdf, reference };
}
