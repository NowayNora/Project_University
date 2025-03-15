import React from "react";
import { cn } from "@/lib/utils";

interface PlaceholderImageProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  width?: number;
  height?: number;
}

export function PlaceholderImage({
  text = "Chưa có ảnh",
  width = 120,
  height = 120,
  className,
  ...props
}: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gray-200 text-gray-500 text-sm text-center",
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    >
      {text}
    </div>
  );
}