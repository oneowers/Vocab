interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className = "h-full w-full" }: BrandLogoProps) {
  return (
    <img
      src="/brand-logo.png"
      alt="LexiFlow"
      className={`${className} object-contain`}
      draggable={false}
    />
  )
}
