const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const ACCEPTED_BMA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export type AcceptedBmaMimeType = (typeof ACCEPTED_BMA_MIME_TYPES)[number];

export function isAcceptedBmaMime(mime: string): mime is AcceptedBmaMimeType {
  return (ACCEPTED_BMA_MIME_TYPES as readonly string[]).includes(mime);
}

export function validateBmaUpload(
  mime: string,
  size: number,
): { ok: true } | { ok: false; error: string } {
  if (!isAcceptedBmaMime(mime)) {
    return {
      ok: false,
      error: "Upload a BMA report as JPEG, PNG, WebP, GIF, or PDF.",
    };
  }

  if (mime === "application/pdf") {
    if (size > MAX_PDF_BYTES) {
      return { ok: false, error: "PDF must be under 10 MB." };
    }
    return { ok: true };
  }

  if (size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Image must be under 4 MB (Groq vision limit).",
    };
  }

  return { ok: true };
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
}

export function mimeToDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}
