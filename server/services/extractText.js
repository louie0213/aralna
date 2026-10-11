import fs from 'fs/promises';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import { createWorker } from 'tesseract.js';

const MAX_PDF_PAGE_PIXELS = 16_000_000;

const decodeXmlEntities = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function extractPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  let pdf;
  let worker;

  try {
    pdf = await loadingTask.promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      let canvas;

      try {
        const content = await page.getTextContent();
        let text = content.items.map((item) => item.str || '').join(' ').trim();

        if (!text) {
          worker ||= await createWorker('eng');
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(2, Math.sqrt(MAX_PDF_PAGE_PIXELS / (baseViewport.width * baseViewport.height)));
          const viewport = page.getViewport({ scale });
          canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          const result = await worker.recognize(canvas.toBuffer('image/png'));
          text = (result.data.text || '').trim();
        }

        pages.push(text);
      } finally {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        page.cleanup();
      }
    }

    return pages.filter(Boolean).join('\n\n').trim();
  } finally {
    try {
      if (worker) await worker.terminate();
    } finally {
      if (pdf) await pdf.destroy();
      else await loadingTask.destroy();
    }
  }
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
