export type AttachmentMediaType = 'image' | 'video' | 'audio' | 'file';

export interface MimeClassification {
  allowed: boolean;
  type: AttachmentMediaType;
  ext: string;
  labelFa: string;
}

const MIME_MAP: Record<string, { ext: string; type: AttachmentMediaType; labelFa: string }> = {
  // تصاویر
  'image/jpeg': { ext: 'jpg', type: 'image', labelFa: 'تصویر JPG' },
  'image/jpg': { ext: 'jpg', type: 'image', labelFa: 'تصویر JPG' },
  'image/png': { ext: 'png', type: 'image', labelFa: 'تصویر PNG' },
  'image/webp': { ext: 'webp', type: 'image', labelFa: 'تصویر WebP' },
  'image/gif': { ext: 'gif', type: 'image', labelFa: 'تصویر متحرک GIF' },
  // ویدیوها
  'image/svg+xml': { ext: 'svg', type: 'file', labelFa: 'فایل وکتور SVG' },
  'video/mp4': { ext: 'mp4', type: 'video', labelFa: 'ویدیو MP4' },
  'video/webm': { ext: 'webm', type: 'video', labelFa: 'ویدیو WebM' },
  'video/quicktime': { ext: 'mov', type: 'video', labelFa: 'ویدیو MOV' },
  // ویس و فایل‌های صوتی
  'audio/webm': { ext: 'webm', type: 'audio', labelFa: 'پیام صوتی (ویس)' },
  'audio/ogg': { ext: 'ogg', type: 'audio', labelFa: 'پیام صوتی OGG' },
  'audio/mpeg': { ext: 'mp3', type: 'audio', labelFa: 'فایل صوتی MP3' },
  'audio/mp3': { ext: 'mp3', type: 'audio', labelFa: 'فایل صوتی MP3' },
  'audio/wav': { ext: 'wav', type: 'audio', labelFa: 'فایل صوتی WAV' },
  'audio/x-wav': { ext: 'wav', type: 'audio', labelFa: 'فایل صوتی WAV' },
  'audio/mp4': { ext: 'm4a', type: 'audio', labelFa: 'پیام صوتی M4A' },
  'audio/x-m4a': { ext: 'm4a', type: 'audio', labelFa: 'پیام صوتی M4A' },
  'audio/aac': { ext: 'aac', type: 'audio', labelFa: 'فایل صوتی AAC' },
  // اسناد و فایل‌های پروژه
  'application/pdf': { ext: 'pdf', type: 'file', labelFa: 'سند PDF' },
  'application/zip': { ext: 'zip', type: 'file', labelFa: 'فایل فشرده ZIP' },
  'application/x-zip-compressed': { ext: 'zip', type: 'file', labelFa: 'فایل فشرده ZIP' },
  'application/vnd.rar': { ext: 'rar', type: 'file', labelFa: 'فایل فشرده RAR' },
  'application/x-rar-compressed': { ext: 'rar', type: 'file', labelFa: 'فایل فشرده RAR' },
  'application/x-7z-compressed': { ext: '7z', type: 'file', labelFa: 'فایل فشرده 7Z' },
  'application/msword': { ext: 'doc', type: 'file', labelFa: 'سند Word' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: 'docx',
    type: 'file',
    labelFa: 'سند Word',
  },
  'application/vnd.ms-excel': { ext: 'xls', type: 'file', labelFa: 'فایل Excel' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    ext: 'xlsx',
    type: 'file',
    labelFa: 'فایل Excel',
  },
  'application/vnd.ms-powerpoint': { ext: 'ppt', type: 'file', labelFa: 'فایل PowerPoint' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    ext: 'pptx',
    type: 'file',
    labelFa: 'فایل PowerPoint',
  },
  'text/plain': { ext: 'txt', type: 'file', labelFa: 'فایل متنی TXT' },
  'text/csv': { ext: 'csv', type: 'file', labelFa: 'فایل داده CSV' },
  'application/json': { ext: 'json', type: 'file', labelFa: 'فایل JSON' },
  'image/vnd.adobe.photoshop': { ext: 'psd', type: 'file', labelFa: 'فایل لایه‌باز PSD' },
  'application/postscript': { ext: 'ai', type: 'file', labelFa: 'فایل وکتور AI/EPS' },
  'application/octet-stream': { ext: 'bin', type: 'file', labelFa: 'فایل پیوست پروژه' },
};

const EXT_FALLBACK_MAP: Record<string, { ext: string; type: AttachmentMediaType; labelFa: string }> = {
  jpg: { ext: 'jpg', type: 'image', labelFa: 'تصویر JPG' },
  jpeg: { ext: 'jpg', type: 'image', labelFa: 'تصویر JPG' },
  png: { ext: 'png', type: 'image', labelFa: 'تصویر PNG' },
  webp: { ext: 'webp', type: 'image', labelFa: 'تصویر WebP' },
  gif: { ext: 'gif', type: 'image', labelFa: 'تصویر GIF' },
  mp4: { ext: 'mp4', type: 'video', labelFa: 'ویدیو MP4' },
  mov: { ext: 'mov', type: 'video', labelFa: 'ویدیو MOV' },
  mp3: { ext: 'mp3', type: 'audio', labelFa: 'فایل صوتی MP3' },
  ogg: { ext: 'ogg', type: 'audio', labelFa: 'پیام صوتی OGG' },
  wav: { ext: 'wav', type: 'audio', labelFa: 'فایل صوتی WAV' },
  m4a: { ext: 'm4a', type: 'audio', labelFa: 'پیام صوتی M4A' },
  aac: { ext: 'aac', type: 'audio', labelFa: 'فایل صوتی AAC' },
  pdf: { ext: 'pdf', type: 'file', labelFa: 'سند PDF' },
  zip: { ext: 'zip', type: 'file', labelFa: 'فایل فشرده ZIP' },
  rar: { ext: 'rar', type: 'file', labelFa: 'فایل فشرده RAR' },
  '7z': { ext: '7z', type: 'file', labelFa: 'فایل فشرده 7Z' },
  doc: { ext: 'doc', type: 'file', labelFa: 'سند Word' },
  docx: { ext: 'docx', type: 'file', labelFa: 'سند Word' },
  xls: { ext: 'xls', type: 'file', labelFa: 'فایل Excel' },
  xlsx: { ext: 'xlsx', type: 'file', labelFa: 'فایل Excel' },
  ppt: { ext: 'ppt', type: 'file', labelFa: 'فایل PowerPoint' },
  pptx: { ext: 'pptx', type: 'file', labelFa: 'فایل PowerPoint' },
  psd: { ext: 'psd', type: 'file', labelFa: 'فایل لایه‌باز PSD' },
  ai: { ext: 'ai', type: 'file', labelFa: 'فایل لایه‌باز AI' },
  txt: { ext: 'txt', type: 'file', labelFa: 'فایل متنی TXT' },
  csv: { ext: 'csv', type: 'file', labelFa: 'فایل CSV' },
  json: { ext: 'json', type: 'file', labelFa: 'فایل JSON' },
  svg: { ext: 'svg', type: 'file', labelFa: 'فایل وکتور SVG' },
  blend: { ext: 'blend', type: 'file', labelFa: 'فایل سه‌بعدی Blender' },
  fbx: { ext: 'fbx', type: 'file', labelFa: 'مدل سه‌بعدی FBX' },
  obj: { ext: 'obj', type: 'file', labelFa: 'مدل سه‌بعدی OBJ' },
  glb: { ext: 'glb', type: 'file', labelFa: 'مدل سه‌بعدی GLB' },
};

export function classifyAttachmentMime(mimeType: string, fileName = ''): MimeClassification {
  const cleanMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  const extFromName = (fileName.split('.').pop() || '').trim().toLowerCase();

  // اگر فایل با پسوند مشخص ارسال شده و MIME عمومی مثل octet-stream دارد
  if (extFromName && EXT_FALLBACK_MAP[extFromName]) {
    // اگر webm صوتی ضبط شده باشد
    if (cleanMime.startsWith('audio/')) {
      return {
        allowed: true,
        type: 'audio',
        ext: EXT_FALLBACK_MAP[extFromName]?.ext || 'webm',
        labelFa: 'پیام صوتی (ویس)',
      };
    }
    if (cleanMime === 'application/octet-stream' || !MIME_MAP[cleanMime]) {
      const matched = EXT_FALLBACK_MAP[extFromName];
      return {
        allowed: true,
        type: matched.type,
        ext: matched.ext,
        labelFa: matched.labelFa,
      };
    }
  }

  if (MIME_MAP[cleanMime]) {
    // اگر پسوند واقعی فایل از نام فایل مشخص‌تر بود (مثلاً psd با octet-stream)
    const entry = MIME_MAP[cleanMime];
    if (cleanMime === 'application/octet-stream' && extFromName && EXT_FALLBACK_MAP[extFromName]) {
      const byExt = EXT_FALLBACK_MAP[extFromName];
      return { allowed: true, type: byExt.type, ext: byExt.ext, labelFa: byExt.labelFa };
    }
    return {
      allowed: true,
      type: entry.type,
      ext: entry.ext,
      labelFa: entry.labelFa,
    };
  }

  if (cleanMime.startsWith('audio/')) {
    return {
      allowed: true,
      type: 'audio',
      ext: extFromName || 'webm',
      labelFa: 'پیام صوتی (ویس)',
    };
  }

  return {
    allowed: false,
    type: 'file',
    ext: '',
    labelFa: 'فرمت غیرمجاز',
  };
}

export function formatFileSizeFa(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function formatDurationTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
