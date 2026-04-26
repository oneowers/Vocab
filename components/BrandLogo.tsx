interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className = "h-full w-full" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <rect width="64" height="64" rx="14" fill="#05052F" />
      <path
        fill="#FFFFFF"
        d="M13.6 21.6c2.7-2 5.8-3.5 9.4-3.5c4.8 0 7.8 2.4 8.8 6.6l-1.8 11.4c-.6 3.8-.8 6.1-.8 8.4c0 4 1.7 6.5 5 6.5c4 0 6.8-5 7.7-10.7l2.1-15.2h7.7l-1.9 15.4c-.4 3.3-.6 5.1-.6 7.3c0 4.2 1.8 6.8 5.1 6.8c4 0 7-4.5 8-10.4L64 25.1h-7.8l.3 2.7c.2 1.8.3 3.8.3 5.7c0 11.6-5.3 24.7-15.3 24.7c-4.2 0-7-2.1-8.5-5.7c-2.5 3.8-5.6 5.7-9.7 5.7c-7.4 0-12.5-5.7-12.5-15.6c0-3.2.3-6.4.9-10.1l1.1-7c-.9-.9-1.8-2-3-3.9l3.8-2.9Z"
      />
    </svg>
  )
}
