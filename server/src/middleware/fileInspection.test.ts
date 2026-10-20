import { describe, expect, it } from 'vitest';

import { HttpError } from '../errors/httpError.js';
import { validateUploadedFile, type ApplicationFileField } from './fileInspection.js';

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return output;
}

function validPng() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function storedZip(entries: Record<string, string>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  Object.entries(entries).forEach(([name, value]) => {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.from(value);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, nameBuffer);
    localOffset += local.length + nameBuffer.length + data.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(Object.keys(entries).length, 8);
  eocd.writeUInt16LE(Object.keys(entries).length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, eocd]);
}

function uploadedFile(
  fieldName: ApplicationFileField,
  originalname: string,
  mimetype: string,
  buffer: Buffer,
) {
  return {
    fieldname: fieldName,
    originalname,
    encoding: '7bit',
    mimetype,
    buffer,
    size: buffer.length,
  } as Express.Multer.File;
}

describe('validateUploadedFile', () => {
  it.each([
    ['cv', 'resume.pdf', 'application/pdf', Buffer.from('%PDF-1.7\n1 0 obj\n%%EOF\n')],
    [
      'cv',
      'resume.doc',
      'application/msword',
      Buffer.concat([
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
        Buffer.alloc(504),
      ]),
    ],
    [
      'cv',
      'resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      storedZip({
        '[Content_Types].xml': '<Types></Types>',
        'word/document.xml': '<w:document></w:document>',
      }),
    ],
    ['paymentScreenshot', 'payment.png', 'image/png', validPng()],
  ] as const)('accepts valid %s content in %s', (field, filename, mimeType, buffer) => {
    expect(validateUploadedFile(field, uploadedFile(field, filename, mimeType, buffer))).toMatchObject({
      fieldName: field,
      mimeType,
    });
  });

  it('rejects extension, MIME and byte-signature mismatches', () => {
    const spoofed = uploadedFile('cv', 'resume.pdf', 'application/pdf', validPng());

    expect(() => validateUploadedFile('cv', spoofed)).toThrow(HttpError);
  });

  it('rejects truncated images and incomplete DOCX containers', () => {
    const truncatedPng = validPng().subarray(0, -2);
    const missingDocument = storedZip({ '[Content_Types].xml': '<Types></Types>' });

    expect(() =>
      validateUploadedFile(
        'paymentScreenshot',
        uploadedFile('paymentScreenshot', 'payment.png', 'image/png', truncatedPng),
      ),
    ).toThrow(HttpError);
    expect(() =>
      validateUploadedFile(
        'cv',
        uploadedFile(
          'cv',
          'resume.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          missingDocument,
        ),
      ),
    ).toThrow(HttpError);
  });

  it('rejects a DOCX entry that declares bomb-like expansion', () => {
    const bomb = storedZip({
      '[Content_Types].xml': '<Types></Types>',
      'word/document.xml': '<w:document></w:document>',
    });
    const centralSignature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
    const centralOffset = bomb.indexOf(centralSignature);
    bomb.writeUInt32LE(25 * 1024 * 1024, centralOffset + 24);

    expect(() =>
      validateUploadedFile(
        'cv',
        uploadedFile(
          'cv',
          'resume.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          bomb,
        ),
      ),
    ).toThrow(HttpError);
  });

  it('normalizes attachment filenames', () => {
    const result = validateUploadedFile(
      'cv',
      uploadedFile('cv', '../../résumé final.pdf', 'application/pdf', Buffer.from('%PDF-1.7\n%%EOF')),
    );

    expect(result.filename).toBe('r_sum_final.pdf');
    expect(result.filename).not.toContain('..');
  });
});
