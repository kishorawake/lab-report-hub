/**
 * Real OCR + PDF text extraction (client-side, no server needed).
 * - PDFs: try pdfjs-dist text layer first; if nearly empty (scanned PDF),
 *   fall back to rasterising each page and running tesseract.js.
 * - Images: tesseract.js OCR.
 * - Text/CSV: read directly.
 */

type ProgressFn = (msg: string, pct?: number) => void;

async function extractFromImage(file: File | Blob, onProgress?: ProgressFn): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  onProgress?.("Loading OCR engine…", 5);
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress?.("Reading your report…", 20 + Math.round(m.progress * 70));
      }
    },
  });
  try {
    const url = file instanceof File ? URL.createObjectURL(file) : URL.createObjectURL(file);
    const { data } = await worker.recognize(url);
    URL.revokeObjectURL(url);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}

async function extractFromPdf(file: File, onProgress?: ProgressFn): Promise<string> {
  onProgress?.("Reading PDF…", 5);
  const pdfjs = await import("pdfjs-dist");
  // Use a CDN worker matching the installed version to avoid bundling issues.
  // @ts-expect-error - version is available at runtime
  const version = pdfjs.version || "4.7.76";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let fullText = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    onProgress?.(`Extracting page ${p}/${pdf.numPages}…`, 10 + Math.round((p / pdf.numPages) * 40));
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    fullText += "\n" + pageText;
  }

  // If the PDF has very little extractable text, it's likely scanned → OCR fallback.
  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 30) {
    onProgress?.("Scanned PDF detected — running OCR…", 50);
    let ocrText = "";
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") {
          onProgress?.("Reading your report…", 50 + Math.round(m.progress * 45));
        }
      },
    });
    try {
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        const { data } = await worker.recognize(url);
        URL.revokeObjectURL(url);
        ocrText += "\n" + (data.text || "");
      }
    } finally {
      await worker.terminate();
    }
    return ocrText;
  }

  return fullText;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: ProgressFn
): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractFromPdf(file, onProgress);
  }
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp)$/.test(name)) {
    return extractFromImage(file, onProgress);
  }
  // Text / CSV
  return file.text();
}
