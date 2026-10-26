export function chunkKnowledgeContent(content: string, chunkSize = 900, overlap = 150): string[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const chunks: string[] = [];
  let offset = 0;
  while (offset < normalized.length) {
    let end = Math.min(normalized.length, offset + chunkSize);
    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf(' ', end);
      if (boundary > offset + Math.floor(chunkSize / 2)) end = boundary;
    }
    const chunk = normalized.slice(offset, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    offset = Math.max(end - overlap, offset + 1);
  }
  return chunks;
}
