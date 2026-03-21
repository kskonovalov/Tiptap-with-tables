export const FontSizeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Small "A" */}
    <path d="M3 14l2.5-6 2.5 6" />
    <path d="M4 12h3" />
    {/* Large "A" */}
    <path d="M11 19l4-10 4 10" />
    <path d="M12.5 15.5h5" />
  </svg>
)
