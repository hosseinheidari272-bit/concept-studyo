import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAttachmentMime,
  formatFileSizeFa,
  formatDurationTimer,
} from './chatMediaUtils';

test('classifyAttachmentMime identifies recorded voice webm and audio formats', () => {
  const voiceWebm = classifyAttachmentMime('audio/webm;codecs=opus', 'voice-message.webm');
  assert.equal(voiceWebm.allowed, true);
  assert.equal(voiceWebm.type, 'audio');
  assert.equal(voiceWebm.ext, 'webm');

  const mp3Audio = classifyAttachmentMime('audio/mpeg', 'podcast.mp3');
  assert.equal(mp3Audio.allowed, true);
  assert.equal(mp3Audio.type, 'audio');
  assert.equal(mp3Audio.ext, 'mp3');
});

test('classifyAttachmentMime identifies PDF, ZIP, PSD, and Word documents', () => {
  const pdfDoc = classifyAttachmentMime('application/pdf', 'brief.pdf');
  assert.equal(pdfDoc.allowed, true);
  assert.equal(pdfDoc.type, 'file');
  assert.equal(pdfDoc.ext, 'pdf');

  const zipArchive = classifyAttachmentMime('application/zip', 'project-assets.zip');
  assert.equal(zipArchive.allowed, true);
  assert.equal(zipArchive.type, 'file');
  assert.equal(zipArchive.ext, 'zip');

  const psdFile = classifyAttachmentMime('application/octet-stream', 'logo-master.psd');
  assert.equal(psdFile.allowed, true);
  assert.equal(psdFile.type, 'file');
  assert.equal(psdFile.ext, 'psd');
});

test('classifyAttachmentMime rejects executable or dangerous formats', () => {
  const exeFile = classifyAttachmentMime('application/x-msdownload', 'malware.exe');
  assert.equal(exeFile.allowed, false);

  const htmlFile = classifyAttachmentMime('text/html', 'xss.html');
  assert.equal(htmlFile.allowed, false);
});

test('formatFileSizeFa and formatDurationTimer format values accurately', () => {
  assert.equal(formatFileSizeFa(512), '512 B');
  assert.equal(formatFileSizeFa(2048), '2.0 KB');
  assert.equal(formatFileSizeFa(5 * 1024 * 1024), '5.00 MB');
  assert.equal(formatDurationTimer(0), '00:00');
  assert.equal(formatDurationTimer(65), '01:05');
});
