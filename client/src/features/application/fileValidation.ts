export const maximumUploadBytes = 5 * 1024 * 1024;

export type ApplicationFileKey = 'cv' | 'paymentScreenshot';

export interface ApplicationFiles {
  cv?: File;
  paymentScreenshot?: File;
}

const rules: Record<
  ApplicationFileKey,
  { extensions: string[]; label: string; mimeTypes: string[]; required: boolean }
> = {
  cv: {
    extensions: ['pdf', 'doc', 'docx'],
    label: 'CV',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    required: true,
  },
  paymentScreenshot: {
    extensions: ['jpg', 'jpeg', 'png'],
    label: 'Payment screenshot',
    mimeTypes: ['image/jpeg', 'image/png'],
    required: true,
  },
};

function fileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

export function validateApplicationFile(key: ApplicationFileKey, file?: File): string | undefined {
  const rule = rules[key];

  if (!file) return rule.required ? `${rule.label} is required.` : undefined;
  if (file.size > maximumUploadBytes) return `${rule.label} must be 5 MiB or smaller.`;

  if (!rule.mimeTypes.includes(file.type) || !rule.extensions.includes(fileExtension(file))) {
    return `${rule.label} has an unsupported file type.`;
  }

  return undefined;
}

export function validateApplicationFiles(files: ApplicationFiles) {
  return (Object.keys(rules) as ApplicationFileKey[]).reduce<
    Partial<Record<ApplicationFileKey, string>>
  >((errors, key) => {
    const error = validateApplicationFile(key, files[key]);
    if (error) errors[key] = error;
    return errors;
  }, {});
}
