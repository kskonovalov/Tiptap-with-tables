export const ERROR_MESSAGES = {
  UNKNOWN:                 "Не удалось загрузить блок",
  INVALID_NODE_INPUT:      "Блок повреждён и не может быть отображён",
  INVALID_MARK_DATA:       "Форматирование блока повреждено",
  INVALID_TEXT_NODE:       "Текстовый блок повреждён",
  EMPTY_TEXT_NODE:         "Текстовый блок пуст",
  INVALID_FRAGMENT_INPUT:  "Структура документа повреждена",
  CANNOT_CONVERT_FRAGMENT: "Не удалось загрузить содержимое блока",
  INVALID_MARK_INPUT:      "Форматирование повреждено",
  UNKNOWN_NODE_TYPE:  (type: string) => `Неизвестный тип блока «${type}»`,
  INVALID_CONTENT:    (node: string) => `Блок «${node}» содержит недопустимые данные`,
  UNKNOWN_MARK_TYPE:  (type: string) => `Неизвестный тип форматирования «${type}»`,
} as const

type Translator = (match: RegExpMatchArray) => string

const PATTERNS: [RegExp, Translator][] = [
  [/^Invalid input for Node\.fromJSON$/,          () => ERROR_MESSAGES.INVALID_NODE_INPUT],
  [/^Invalid mark data for Node\.fromJSON$/,      () => ERROR_MESSAGES.INVALID_MARK_DATA],
  [/^Invalid text node in JSON$/,                 () => ERROR_MESSAGES.INVALID_TEXT_NODE],
  [/^Empty text nodes are not allowed$/,          () => ERROR_MESSAGES.EMPTY_TEXT_NODE],
  [/^Invalid input for Fragment\.fromJSON$/,      () => ERROR_MESSAGES.INVALID_FRAGMENT_INPUT],
  [/^Can not convert /,                           () => ERROR_MESSAGES.CANNOT_CONVERT_FRAGMENT],
  [/^Invalid input for Mark\.fromJSON$/,          () => ERROR_MESSAGES.INVALID_MARK_INPUT],
  [/^Unknown node type: (.+)$/,                   (m) => ERROR_MESSAGES.UNKNOWN_NODE_TYPE(m[1])],
  [/^Invalid content for node (\S+)/,             (m) => ERROR_MESSAGES.INVALID_CONTENT(m[1])],
  [/^There is no mark type (.+) in this schema$/, (m) => ERROR_MESSAGES.UNKNOWN_MARK_TYPE(m[1])],
]

export function translateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  for (const [pattern, translate] of PATTERNS) {
    const match = msg.match(pattern)
    if (match) return translate(match)
  }
  return ERROR_MESSAGES.UNKNOWN
}
