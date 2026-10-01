import fs from 'fs/promises';
import PDFParse from 'pdf-parse';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import { createWorker } from 'tesseract.js';

const decodeXmlEntities = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function extractPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const { text } = await PDFParse(buffer);
  return text.trim();
}

async function extractDocx(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath });
  return value.trim();
}

// A .pptx is a zip of XML files. Slide text lives inside <a:t> tags in ppt/slides/slideN.xml.
// This avoids pulling in a heavy Office-parsing library for something this small.
function extractPptx(filePath) {
  const zip = new AdmZip(filePath);
  const slideEntries = zip
    .getEntries()
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a, b) => {
      const na = Number(a.entryName.match(/slide(\d+)\.xml/)[1]);
      const nb = Number(b.entryName.match(/slide(\d+)\.xml/)[1]);
      return na - nb;
    });

  return slideEntries
    .map((entry, i) => {
      const xml = entry.getData().toString('utf8');
      const texts = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/gs)].map((m) => decodeXmlEntities(m[1]));
      return `Slide ${i + 1}\n${texts.join(' ')}`;
    })
    .join('\n\n')
    .trim();
}

async function extractTxt(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return content.trim();
}

// OCR. The first call on a machine downloads English trained data (a few MB) and caches it,
// so it needs internet the first time it runs.
async function extractImage(filePath) {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(filePath);
    return (data.text || '').trim();
  } finally {
    await worker.terminate();
  }
}

const EXTRACTORS = {
  '.pdf': extractPdf,
  '.docx': extractDocx,
  '.pptx': extractPptx,
  '.txt': extractTxt,
  '.png': extractImage,
  '.jpg': extractImage,
  '.jpeg': extractImage,
  '.webp': extractImage,
};

export function isSupportedExtension(ext) {
  return Object.prototype.hasOwnProperty.call(EXTRACTORS, ext.toLowerCase());
}

export async function extractText(filePath, ext) {
  const fn = EXTRACTORS[ext.toLowerCase()];
  if (!fn) throw new Error(`Unsupported file type: ${ext}`);
  return fn(filePath);
}
