export type ColorType =
  | "default"
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"

export interface ColorOption {
  type: ColorType
  label: string
  value: string
}

export const COLOR_OPTIONS: ColorOption[] = [
  { type: "default", label: "По умолчанию", value: "" },
  { type: "gray", label: "Серый", value: "#6B7280" },
  { type: "red", label: "Красный", value: "#EF4444" },
  { type: "orange", label: "Оранжевый", value: "#F97316" },
  { type: "yellow", label: "Жёлтый", value: "#EAB308" },
  { type: "green", label: "Зелёный", value: "#22C55E" },
  { type: "blue", label: "Синий", value: "#3B82F6" },
  { type: "purple", label: "Фиолетовый", value: "#A855F7" },
  { type: "pink", label: "Розовый", value: "#EC4899" },
]
