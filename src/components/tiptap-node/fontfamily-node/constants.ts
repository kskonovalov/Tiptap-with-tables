export type FontFamilyType =
  | "arial"
  | "georgia"
  | "times"
  | "verdana"
  | "courier"
  | "trebuchet"
  | "impact"
  | "comic"

export interface FontFamilyOption {
  type: FontFamilyType
  label: string
  value: string
}

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  { type: "arial",     label: "Arial",           value: "Arial, Helvetica, sans-serif" },
  { type: "georgia",   label: "Georgia",          value: "Georgia, 'Times New Roman', serif" },
  { type: "times",     label: "Times New Roman",  value: "'Times New Roman', Times, serif" },
  { type: "verdana",   label: "Verdana",          value: "Verdana, Geneva, sans-serif" },
  { type: "courier",   label: "Courier New",      value: "'Courier New', Courier, monospace" },
  { type: "trebuchet", label: "Trebuchet MS",      value: "'Trebuchet MS', Helvetica, sans-serif" },
  { type: "impact",    label: "Impact",            value: "Impact, Charcoal, sans-serif" },
  { type: "comic",     label: "Comic Sans MS",     value: "'Comic Sans MS', cursive, sans-serif" },
]
