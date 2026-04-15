type Block = {
  id?: string;
  type: string;
  data: Record<string, any>;
  tunes?: Record<string, any>;
};

const ALLOWED_TYPES = new Set(["paragraph", "customParagraph", "Table"]);

function isAllowed(block: Block): boolean {
  if (!block.id) return false;
  if (!ALLOWED_TYPES.has(block.type)) return false;
  if (block.type === "customParagraph" && block.data.text === "") return false;
  if (
    block.type === "Table" &&
    (!block.data.content || (block.data.content as string[][]).length === 0)
  )
    return false;
  return true;
}

function getComparisonKey(block: Block): string {
  if (block.type === "paragraph" || block.type === "customParagraph") {
    return block.data.text ?? "";
  }
  // Table
  return JSON.stringify({
    content: block.data.content,
    filters: block.data.filters,
  });
}

function paragraphToHTML(block: Block): string {
  return `<p>${block.data.text ?? ""}</p>`;
}

function tableToHTML(block: Block, otherContent?: string[][]): string {
  const content: string[][] = block.data.content ?? [];
  if (content.length === 0) return "";

  const colCount = content[0]?.length ?? 0;

  // First row always as <thead>
  const theadCells = content[0].map((cell) => `<th>${cell}</th>`).join("");
  const thead = `<thead><tr>${theadCells}</tr></thead>`;

  if (content.length === 1) {
    return `<table>${thead}</table>`;
  }

  let tbodyRows = "";
  let lastWasPlaceholder = false;

  for (let i = 1; i < content.length; i++) {
    const row = content[i];

    let isChanged: boolean;
    if (!otherContent) {
      // Full render — removed or added block, show all rows
      isChanged = true;
    } else {
      const otherRow = otherContent[i];
      if (!otherRow) {
        // Row doesn't exist in the other version
        isChanged = true;
      } else {
        isChanged = JSON.stringify(row) !== JSON.stringify(otherRow);
      }
    }

    if (isChanged) {
      const cells = row.map((cell) => `<td>${cell}</td>`).join("");
      tbodyRows += `<tr>${cells}</tr>`;
      lastWasPlaceholder = false;
    } else if (!lastWasPlaceholder) {
      tbodyRows += `<tr><td colspan="${colCount}">...</td></tr>`;
      lastWasPlaceholder = true;
    }
  }

  const tbody = tbodyRows ? `<tbody>${tbodyRows}</tbody>` : "";
  return `<table>${thead}${tbody}</table>`;
}

function blockToHTML(block: Block, otherBlock?: Block): string {
  if (block.type === "paragraph" || block.type === "customParagraph") {
    return paragraphToHTML(block);
  }
  if (block.type === "Table") {
    return tableToHTML(
      block,
      otherBlock?.data.content as string[][] | undefined,
    );
  }
  return "";
}

export function grabPageDiff(
  blocksBefore: Block[],
  blocksAfter: Block[],
): [string, string] {
  const filteredBefore = blocksBefore.filter(isAllowed);
  const filteredAfter = blocksAfter.filter(isAllowed);

  const beforeMap = new Map<string, Block>();
  for (const block of filteredBefore) {
    beforeMap.set(block.id!, block);
  }

  const afterMap = new Map<string, Block>();
  for (const block of filteredAfter) {
    afterMap.set(block.id!, block);
  }

  let beforeHTML = "";
  let afterHTML = "";

  // beforeHTML: before-version of changed blocks + removed blocks (in blocksBefore order)
  for (const block of filteredBefore) {
    const id = block.id!;
    const counterpart = afterMap.get(id);
    if (!counterpart) {
      // Removed block — full render
      beforeHTML += blockToHTML(block);
    } else if (getComparisonKey(block) !== getComparisonKey(counterpart)) {
      // Changed block — render before version, compare against after for table rows
      beforeHTML += blockToHTML(block, counterpart);
    }
    // Unchanged → skip
  }

  // afterHTML: after-version of changed blocks + added blocks (in blocksAfter order)
  for (const block of filteredAfter) {
    const id = block.id!;
    const counterpart = beforeMap.get(id);
    if (!counterpart) {
      // Added block — full render
      afterHTML += blockToHTML(block);
    } else if (getComparisonKey(block) !== getComparisonKey(counterpart)) {
      // Changed block — render after version, compare against before for table rows
      afterHTML += blockToHTML(block, counterpart);
    }
    // Unchanged → skip
  }

  return [beforeHTML, afterHTML];
}
