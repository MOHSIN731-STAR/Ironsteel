import React from "react";

interface CartCountProps {
  count: number;
}

export default function CartCount({
  count,
}: CartCountProps): React.ReactElement | null {
  if (count === 0) return null;

  return (
    <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {count}
    </span>
  );
}