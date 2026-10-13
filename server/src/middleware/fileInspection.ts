import { basename, extname } from 'node:path';
import { inflateRawSync } from 'node:zlib';

import { HttpError } from '../errors/httpError.js';

export type ApplicationFileField = 'cv' | 'passportCopy' | 'photo' | 'paymentScreenshot';

export interface ValidatedApplicationFile {
  buffer: Buffer;
  fieldName: ApplicationFileField;
  filename: string;
  mimeType: string;
  size: number;
}

const pdfMime = 'application/pdf';
const jpegMime = 'image/jpeg';
const pngMime = 'image/png';
const docMime = 'application/msword';
const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const allowedFiles: Record<ApplicationFileField, Record<string, string[]>> = {
  cv: {
    pdf: [pdfMime],
    doc: [docMime],
    docx: [docxMime],
  },
  passportCopy: {
    jpg: [jpegMime],
    jpeg: [jpegMime],
    png: [pngMime],
    pdf: [pdfMime],
  },
  photo: {
    jpg: [jpegMime],
    jpeg: [jpegMime],
    png: [pngMime],
    pdf: [pdfMime],
  },
  paymentScreenshot: {
    jpg: [jpegMime],
    jpeg: [jpegMime],
    png: [pngMime],
  },
};

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

function isPdf(buffer: Buffer) {
  if (buffer.length < 12 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') return false;
  return buffer.subarray(Math.max(0, buffer.length - 1_024)).includes(Buffer.from('%%EOF'));
}

function isJpeg(buffer: Buffer) {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff &&
    buffer[buffer.length - 2] === 0xff &&
    buffer[buffer.length - 1] === 0xd9
  );
}

function isPng(buffer: Buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) return false;

  let offset = 8;
  let chunkIndex = 0;
  let foundEnd = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const crcOffset = dataStart + length;
    const nextOffset = crcOffset + 4;
    if (length > 10 * 1024 * 1024 || nextOffset > buffer.length) return false;

    const type = buffer.subarray(typeStart, dataStart).toString('ascii');
    const expectedCrc = buffer.readUInt32BE(crcOffset);
    if (crc32(buffer.subarray(typeStart, crcOffset)) !== expectedCrc) return false;
    if (chunkIndex === 0 && (type !== 'IHDR' || length !== 13)) return false;
    if (type === 'IEND') {
      if (length !== 0 || nextOffset !== buffer.length) return false;
      foundEnd = true;
      break;
    }

    chunkIndex += 1;
    offset = nextOffset;
  }

  return foundEnd;
}

function isDoc(buffer: Buffer) {
  const signature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  return buffer.length >= 512 && buffer.subarray(0, signature.length).equals(signature);
}

interface ZipEntry {
  compressedSize: number;
  compressionMethod: number;
  crc: number;
  dataOffset: number;
  name: string;
  uncompressedSize: number;
}

function readZipEntries(buffer: Buffer): Map<string, ZipEntry> | undefined {
  const eocdSignature = 0x06054b50;
  const minimumEocdSize = 22;
  const searchStart = Math.max(0, buffer.length - 65_557);
  let eocdOffset = -1;

  for (let offset = buffer.length - minimumEocdSize; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0 || eocdOffset + minimumEocdSize > buffer.length) return undefined;

  const disk = buffer.readUInt16LE(eocdOffset + 4);
  const centralDisk = buffer.readUInt16LE(eocdOffset + 6);
  const entriesOnDisk = buffer.readUInt16LE(eocdOffset + 8);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const commentLength = buffer.readUInt16LE(eocdOffset + 20);

  if (
    disk !== 0 ||
    centralDisk !== 0 ||
    entriesOnDisk !== entryCount ||
    entryCount === 0 ||
    entryCount > 100 ||
    centralSize > 1024 * 1024 ||
    centralOffset + centralSize > eocdOffset ||
    eocdOffset + minimumEocdSize + commentLength !== buffer.length
  ) {
    return undefined;
  }

  const entries = new Map<string, ZipEntry>();
  let cursor = centralOffset;
  let totalUncompressed = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) return undefined;
    const flags = buffer.readUInt16LE(cursor + 8);
    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const crc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const entryCommentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const nextCursor = cursor + 46 + nameLength + extraLength + entryCommentLength;
    if (nextCursor > buffer.length || (flags & 0x1) !== 0 || ![0, 8].includes(compressionMethod)) {
      return undefined;
    }

    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    if (
      !name ||
      name.includes('\0') ||
      name.includes('\\') ||
      name.startsWith('/') ||
      name.split('/').some((part) => part === '..') ||
      entries.has(name)
    ) {
      return undefined;
    }

    totalUncompressed += uncompressedSize;
    if (
      uncompressedSize > 10 * 1024 * 1024 ||
      totalUncompressed > 20 * 1024 * 1024 ||
      uncompressedSize / Math.max(1, compressedSize) > 100 ||
      localOffset + 30 > buffer.length ||
      buffer.readUInt32LE(localOffset) !== 0x04034b50
    ) {
      return undefined;
    }

    const localMethod = buffer.readUInt16LE(localOffset + 8);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const localNameStart = localOffset + 30;
    const dataOffset = localNameStart + localNameLength + localExtraLength;
    const localName = buffer.subarray(localNameStart, localNameStart + localNameLength).toString('utf8');
    if (
      localMethod !== compressionMethod ||
      localName !== name ||
      dataOffset + compressedSize > buffer.length
    ) {
      return undefined;
    }

    entries.set(name, {
      compressedSize,
      compressionMethod,
      crc,
      dataOffset,
      name,
      uncompressedSize,
    });
    cursor = nextCursor;
  }

  return cursor === centralOffset + centralSize ? entries : undefined;
}

function extractZipEntry(buffer: Buffer, entry: ZipEntry) {
  const compressed = buffer.subarray(entry.dataOffset, entry.dataOffset + entry.compressedSize);
  const content =
    entry.compressionMethod === 0
      ? Buffer.from(compressed)
      : inflateRawSync(compressed, { maxOutputLength: entry.uncompressedSize + 1 });
  if (content.length !== entry.uncompressedSize || crc32(content) !== entry.crc) return undefined;
  return content;
}

function isDocx(buffer: Buffer) {
  try {
    const entries = readZipEntries(buffer);
    const contentTypesEntry = entries?.get('[Content_Types].xml');
    const documentEntry = entries?.get('word/document.xml');
    if (!contentTypesEntry || !documentEntry) return false;

    const contentTypes = extractZipEntry(buffer, contentTypesEntry)?.toString('utf8');
    const document = extractZipEntry(buffer, documentEntry)?.toString('utf8');
    return Boolean(contentTypes?.includes('<Types') && document?.includes('<w:document'));
  } catch {
    return false;
  }
}

function matchesContent(extension: string, buffer: Buffer) {
  if (extension === 'pdf') return isPdf(buffer);
  if (extension === 'jpg' || extension === 'jpeg') return isJpeg(buffer);
  if (extension === 'png') return isPng(buffer);
  if (extension === 'doc') return isDoc(buffer);
  if (extension === 'docx') return isDocx(buffer);
  return false;
}

function safeFilename(originalName: string, extension: string) {
  const stem = basename(originalName, extname(originalName))
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 80);
  return `${stem || 'attachment'}.${extension}`;
}

export function validateUploadedFile(
  fieldName: ApplicationFileField,
  file: Express.Multer.File,
): ValidatedApplicationFile {
  const extension = extname(file.originalname).slice(1).toLowerCase();
  const allowedMimeTypes = allowedFiles[fieldName][extension];

  if (
    !allowedMimeTypes?.includes(file.mimetype) ||
    file.buffer.length !== file.size ||
    !matchesContent(extension, file.buffer)
  ) {
    throw new HttpError(400, 'invalid_upload', `${fieldName} has an invalid or mismatched file.`);
  }

  return {
    buffer: file.buffer,
    fieldName,
    filename: safeFilename(file.originalname, extension),
    mimeType: file.mimetype,
    size: file.size,
  };
}
