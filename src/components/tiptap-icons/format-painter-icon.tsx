import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const FormatPainterIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Brush body (diagonal handle + head) */}
      <path d="M5 20L3 18L19 4L21 6L5 20Z" />
      {/* Paint tip circle */}
      <circle cx="3.5" cy="20.5" r="1.5" />
      {/* Brush head highlight */}
      <path d="M17 6L18 7L7 18L6 17L17 6Z" opacity="0.4" />
    </svg>
  )
})

FormatPainterIcon.displayName = "FormatPainterIcon"
