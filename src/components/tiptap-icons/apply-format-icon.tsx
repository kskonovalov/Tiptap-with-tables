import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const ApplyFormatIcon = memo(({ className, ...props }: SvgProps) => {
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
      {/* Brush body */}
      <path d="M5 16L3 14L15 2L17 4L5 16Z" />
      {/* Paint tip circle */}
      <circle cx="3.5" cy="16.5" r="1.5" />
      {/* Brush head highlight */}
      <path d="M13 4L14 5L5 14L4 13L13 4Z" opacity="0.4" />
      {/* Checkmark (apply indicator) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.707 14.293a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 1 1 1.414-1.414L16 18.586l4.293-4.293a1 1 0 0 1 1.414 0Z"
      />
    </svg>
  )
})

ApplyFormatIcon.displayName = "ApplyFormatIcon"
