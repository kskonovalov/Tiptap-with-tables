export type FontSizeType = "xs" | "sm" | "base" | "lg" | "xl"

export interface FontSizeOption {
  type: FontSizeType
  label: string
  value: string
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { type: "xs", label: "Очень мелкий", value: "0.5em" },
  { type: "sm", label: "Мелкий", value: "0.75em" },
  { type: "base", label: "Обычный", value: "1em" },
  { type: "lg", label: "Крупный", value: "1.25em" },
  { type: "xl", label: "Очень крупный", value: "2em" },
]
