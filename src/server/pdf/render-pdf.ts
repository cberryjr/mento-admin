export type PdfDocument = {
  title: string;
  lines: string[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const FONT_SIZE = 12;
const LINE_HEIGHT = 14;
const PAGE_MARGIN = 50;
const MAX_LINE_LENGTH = 88;
const LINES_PER_PAGE = 48;

function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function wrapParagraph(paragraph: string): string[] {
  if (!paragraph) {
    return [""];
  }

  const words = paragraph.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= MAX_LINE_LENGTH) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function prepareLines(lines: string[]): string[] {
  return lines.flatMap((line) => {
    const normalizedLine = normalizeText(line);
    return normalizedLine.split("\n").flatMap((paragraph) => wrapParagraph(paragraph));
  });
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPageContent(lines: string[]): string {
  const commands = [
    "BT",
    `/F1 ${FONT_SIZE} Tf`,
    `${LINE_HEIGHT} TL`,
    `${PAGE_MARGIN} ${PAGE_HEIGHT - PAGE_MARGIN} Td`,
  ];

  lines.forEach((line, index) => {
    if (index > 0) {
      commands.push("T*");
    }

    commands.push(`(${escapePdfText(line)}) Tj`);
  });

  commands.push("ET");

  return commands.join("\n");
}

function chunkLines(lines: string[]): string[][] {
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += LINES_PER_PAGE) {
    pages.push(lines.slice(index, index + LINES_PER_PAGE));
  }

  return pages.length > 0 ? pages : [[""]];
}

export function renderPdf(document: PdfDocument): Uint8Array {
  const preparedLines = prepareLines([document.title, "", ...document.lines]);
  const pages = chunkLines(preparedLines);
  const objects: string[] = [""];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  const pageReferences: string[] = [];

  for (const pageLines of pages) {
    const content = buildPageContent(pageLines);
    const contentObjectNumber = objects.length;
    objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);

    const pageObjectNumber = objects.length;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );

    pageReferences.push(`${pageObjectNumber} 0 R`);
  }

  objects[2] = `<< /Type /Pages /Count ${pageReferences.length} /Kids [${pageReferences.join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    offsets[objectNumber] = Buffer.byteLength(pdf, "utf8");
    pdf += `${objectNumber} 0 obj\n${objects[objectNumber]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    pdf += `${offsets[objectNumber].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
