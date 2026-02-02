import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const ColumnsIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="18"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="18"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
})

ColumnsIcon.displayName = "ColumnsIcon"
