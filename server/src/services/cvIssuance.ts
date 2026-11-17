import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { createCvReference, signIssuedCv, verifyIssuedCv } from './cvIdentity.js';

// Admin-only: shared by the private CLI and the authenticated issuance endpoint.
export async function issueCv(input: Buffer, secret?: string, maximumBytes = 5 * 1024 * 1024) {
  if (
    !input.subarray(0, 5).equals(Buffer.from('%PDF-')) ||
    !input.includes(Buffer.from('%%EOF')) ||
    input.length > maximumBytes ||
    input.includes(Buffer.from('\n%RL-CV-V1:'))
  ) {
    throw new Error('Use the original unsigned PDF within the upload limit.');
  }
  const document = await PDFDocument.load(input, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  if (document.getPageCount() < 1 || document.getPageCount() > 100)
    throw new Error('Use a PDF with 1–100 pages.');
  const now = new Date();
  const reference = createCvReference(now);
  const page = document.getPage(document.getPageCount() - 1);
  const font = await document.embedFont(StandardFonts.Helvetica);
  // Place only the reference in the last page's visible bottom-right margin.
  // Keep every original page, page box, rotation and content stream intact.
  const crop = page.getCropBox();
  const media = page.getMediaBox();
  const left = Math.max(crop.x, media.x);
  const bottom = Math.max(crop.y, media.y);
  const width = Math.min(crop.x + crop.width, media.x + media.width) - left;
  const height = Math.min(crop.y + crop.height, media.y + media.height) - bottom;
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  const visibleWidth = rotation === 90 || rotation === 270 ? height : width;
  const inset = 12;
  const size = Math.min(8, (visibleWidth - inset * 2) / font.widthOfTextAtSize(reference, 1));
  if (
    !Number.isFinite(size) ||
    size <= 0 ||
    width < 32 ||
    height < 32 ||
    ![0, 90, 180, 270].includes(rotation)
  ) {
    throw new Error('Use a PDF with a readable final page.');
  }
  const textWidth = font.widthOfTextAtSize(reference, size);
  const position =
    rotation === 90
      ? { x: left + width - inset, y: bottom + height - textWidth - inset }
      : rotation === 180
        ? { x: left + textWidth + inset, y: bottom + height - inset }
        : rotation === 270
          ? { x: left + inset, y: bottom + textWidth + inset }
          : { x: left + width - textWidth - inset, y: bottom + inset };
  page.drawText(reference, {
    ...position,
    size,
    font,
    rotate: degrees(rotation),
    color: rgb(0.35, 0.35, 0.35),
  });
  const pdf = signIssuedCv(Buffer.from(await document.save()), reference, secret, now);
  if (pdf.length > maximumBytes)
    throw new Error(
      'The issued PDF exceeds the upload limit. Reduce the original PDF size before issuance.',
    );
  if (!verifyIssuedCv(pdf, secret, now)) throw new Error('Issuance self-check failed.');
  return { pdf, reference };
}
