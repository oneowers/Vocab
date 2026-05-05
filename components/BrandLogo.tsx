interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className = "h-full w-full" }: BrandLogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80" 
        stroke="currentColor" 
        strokeWidth="12" 
        strokeLinecap="round" 
      />
      <circle cx="50" cy="50" r="10" fill="currentColor" />
      <path 
        d="M50 20V50H80" 
        stroke="currentColor" 
        strokeWidth="12" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  )
}
