import { randomBytes } from 'node:crypto';
import {
  PDFArray,
  PDFDocument,
  PDFRawStream,
  StandardFonts,
  decodePDFRawStream,
  degrees,
  type PDFPage,
} from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { issueCv } from './cvIssuance.js';
import { verifyIssuedCv } from './cvIdentity.js';

function contentStreams(page: PDFPage) {
  const contents = page.node.Contents();
  const streams =
    contents instanceof PDFArray
      ? contents.asArray().map((ref) => page.doc.context.lookup(ref))
      : [contents];
  return streams
    .filter((stream): stream is PDFRawStream => stream instanceof PDFRawStream)
    .map((stream) => Buffer.from(decodePDFRawStream(stream).decode()).toString('ascii'));
}
const secret = randomBytes(32).toString('hex');

describe('minimal CV reference issuance', () => {
  it.each([1, 3, 100])(
    'stamps only the last page of a %i-page CV without adding pages or replacing content',
    async (count) => {
      const source = await PDFDocument.create();
      for (let index = 0; index < count; index++) {
        const page = source.addPage([595, 842]);
        page.drawText(`Original CV content, page ${index + 1}`, { x: 30, y: 400 });
      }
      const input = Buffer.from(await source.save());
      const original = await PDFDocument.load(input);
      const result = await issueCv(input, secret);
      const issued = await PDFDocument.load(result.pdf);
      expect(issued.getPageCount()).toBe(count);
      const encoded = Buffer.from(result.reference).toString('hex').toUpperCase();
      for (let index = 0; index < count; index++) {
        const before = original.getPage(index);
        const after = issued.getPage(index);
        expect(after.getMediaBox()).toEqual(before.getMediaBox());
        expect(after.getCropBox()).toEqual(before.getCropBox());
        const text = contentStreams(after).join('\n');
        for (const stream of contentStreams(before)) expect(text).toContain(stream);
        expect(text.includes(encoded)).toBe(index === count - 1);
      }
      const signature = contentStreams(issued.getPage(count - 1)).filter((stream) =>
        stream.includes(encoded),
      );
      expect(signature).toHaveLength(1);
      const addedText = Array.from(signature[0]!.matchAll(/<([A-Fa-f0-9]+)>\s*Tj/g), (match) =>
        Buffer.from(match[1]!, 'hex').toString(),
      );
      expect(addedText).toEqual([result.reference]);
      expect(verifyIssuedCv(result.pdf, secret)).toEqual({ cvReference: result.reference });
      const reSaved = Buffer.from(await issued.save());
      expect(verifyIssuedCv(reSaved, secret)).toBeUndefined();
      const changed = Buffer.from(result.pdf);
      changed[30] ^= 1;
      expect(verifyIssuedCv(changed, secret)).toBeUndefined();
    },
  );

  it.each([0, 90, 180, 270, -90])(
    'keeps the reference visible at the bottom right on a cropped page rotated %i degrees',
    async (rotation) => {
      const source = await PDFDocument.create();
      const page = source.addPage([620, 900]);
      page.setMediaBox(40, 60, 620, 900);
      page.setCropBox(70, 90, 540, 780);
      page.setRotation(degrees(rotation));
      page.drawText('Original CV content', { x: 100, y: 500 });
      const font = await source.embedFont(StandardFonts.Helvetica);
      const result = await issueCv(Buffer.from(await source.save()), secret);
      const issued = await PDFDocument.load(result.pdf);
      const output = issued.getPage(0);
      expect(output.getCropBox()).toEqual(page.getCropBox());
      expect(output.getMediaBox()).toEqual(page.getMediaBox());
      expect(output.getRotation()).toEqual(page.getRotation());
      const encoded = Buffer.from(result.reference).toString('hex').toUpperCase();
      const stream = contentStreams(output).find((text) => text.includes(encoded))!;
      const match = /([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) Tm/.exec(stream);
      expect(match).not.toBeNull();
      const [a, b, c, d, e, f] = match!.slice(1).map(Number) as [
        number,
        number,
        number,
        number,
        number,
        number,
      ];
      const angle = ((rotation % 360) + 360) % 360;
      const crop = page.getCropBox();
      function screenPoint(x: number, y: number) {
        const px = a * x + c * y + e - crop.x;
        const py = b * x + d * y + f - crop.y;
        if (angle === 90) return { x: py, y: crop.width - px };
        if (angle === 180) return { x: crop.width - px, y: crop.height - py };
        if (angle === 270) return { x: crop.height - py, y: px };
        return { x: px, y: py };
      }
      const start = screenPoint(0, 0);
      const end = screenPoint(font.widthOfTextAtSize(result.reference, 8), 0);
      expect(start.y).toBeCloseTo(12);
      expect(end.y).toBeCloseTo(start.y);
      expect(end.x).toBeCloseTo((angle === 90 || angle === 270 ? crop.height : crop.width) - 12);
      expect(start.x).toBeGreaterThan(0);
      expect(verifyIssuedCv(result.pdf, secret)).toEqual({ cvReference: result.reference });
    },
  );

  it('rejects printed references without a signature, invalid input and nested issuance', async () => {
    const source = await PDFDocument.create();
    source.addPage().drawText('RL-CV-2026-ABCDEFGH2345', { x: 20, y: 12, size: 8 });
    const input = Buffer.from(await source.save());
    expect(verifyIssuedCv(input, secret)).toBeUndefined();
    const result = await issueCv(input, secret);
    await expect(issueCv(result.pdf, secret)).rejects.toThrow(/original unsigned/);
    await expect(issueCv(Buffer.from('not PDF'), secret)).rejects.toThrow();
    await expect(issueCv(input, secret, 100)).rejects.toThrow();
  });
});
