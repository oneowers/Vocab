import { ImageResponse } from "next/og"

import { BrandLogo } from "@/components/BrandLogo"

export const size = {
  width: 64,
  height: 64
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent"
        }}
      >
        <BrandLogo className="h-16 w-16" />
      </div>
    ),
    size
  )
}
