const ALLOWED_TYPES = new Set(["paragraph", "customParagraph", "Table"]);

// — TipTap support —

const isTipTap = (input) =>
  (!Array.isArray(input) && input?.type === "doc") ||
  (Array.isArray(input) && input.length > 0 && !("data" in input[0]));

const getTipTapText = (node) => {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(getTipTapText).join("");
};

const tipTapInlineToHTML = (node) => {
  if (node.type !== "text") return (node.content ?? []).map(tipTapInlineToHTML).join("");
  let text = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") text = `<b>${text}</b>`;
    else if (mark.type === "italic") text = `<i>${text}</i>`;
    else if (mark.type === "code") text = `<code>${text}</code>`;
    else if (mark.type === "strike") text = `<s>${text}</s>`;
    else if (mark.type === "link") text = `<a href="${mark.attrs?.href ?? ""}">${text}</a>`;
  }
  return text;
};

const normalizeTipTap = (nodes) =>
  nodes
    .filter((n) => n.type === "paragraph" || n.type === "table")
    .map((node, i) => {
      if (node.type === "paragraph") {
        return { id: String(i), type: "customParagraph", data: { text: tipTapInlineToHTML(node) } };
      }
      return {
        id: String(i),
        type: "Table",
        data: {
          content: (node.content ?? []).map((row) =>
            (row.content ?? []).map((cell) => getTipTapText(cell))
          ),
          filters: node.attrs?.filters,
        },
      };
    });

const getBlocks = (input) => {
  if (!isTipTap(input)) return Array.isArray(input) ? input : [];
  const nodes = Array.isArray(input) ? input : input.content ?? [];
  return normalizeTipTap(nodes);
};

const isAllowed = (block) => {
  if (!block.id) return false;
  if (!ALLOWED_TYPES.has(block.type)) return false;
  if (block.type === "customParagraph" && block.data.text === "") return false;
  if (block.type === "Table" && (!block.data.content || block.data.content.length === 0))
    return false;
  return true;
};

const getComparisonKey = (block) => {
  if (block.type === "paragraph" || block.type === "customParagraph") {
    return block.data.text ?? "";
  }
  return JSON.stringify({
    content: block.data.content,
    filters: block.data.filters,
  });
};

const paragraphToHTML = (block) => `<p>${block.data.text ?? ""}</p>`;

const tableToHTML = (block, otherContent) => {
  const content = block.data.content ?? [];
  if (content.length === 0) return "";

  const colCount = content[0]?.length ?? 0;

  const theadCells = content[0].map((cell) => `<th>${cell}</th>`).join("");
  const thead = `<thead><tr>${theadCells}</tr></thead>`;

  if (content.length === 1) {
    return `<table>${thead}</table>`;
  }

  let tbodyRows = "";
  let lastWasPlaceholder = false;

  for (let i = 1; i < content.length; i++) {
    const row = content[i];

    let isChanged;
    if (!otherContent) {
      isChanged = true;
    } else {
      const otherRow = otherContent[i];
      if (!otherRow) {
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
};

const blockToHTML = (block, otherBlock) => {
  if (block.type === "paragraph" || block.type === "customParagraph") {
    return paragraphToHTML(block);
  }
  if (block.type === "Table") {
    return tableToHTML(block, otherBlock?.data.content);
  }
  return "";
};

const getPageBeforeAfter = (blocksBefore, blocksAfter) => {
  const filteredBefore = getBlocks(blocksBefore).filter(isAllowed);
  const filteredAfter = getBlocks(blocksAfter).filter(isAllowed);

  const beforeMap = new Map();
  for (const block of filteredBefore) {
    beforeMap.set(block.id, block);
  }

  const afterMap = new Map();
  for (const block of filteredAfter) {
    afterMap.set(block.id, block);
  }

  let beforeHTML = "";
  let afterHTML = "";

  for (const block of filteredBefore) {
    const counterpart = afterMap.get(block.id);
    if (!counterpart) {
      beforeHTML += blockToHTML(block);
    } else if (getComparisonKey(block) !== getComparisonKey(counterpart)) {
      beforeHTML += blockToHTML(block, counterpart);
    }
  }

  for (const block of filteredAfter) {
    const counterpart = beforeMap.get(block.id);
    if (!counterpart) {
      afterHTML += blockToHTML(block);
    } else if (getComparisonKey(block) !== getComparisonKey(counterpart)) {
      afterHTML += blockToHTML(block, counterpart);
    }
  }

  return [beforeHTML, afterHTML];
};

module.exports = { getPageBeforeAfter };
