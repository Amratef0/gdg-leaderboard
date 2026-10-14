import { ArrowUp, ArrowDown, Minus } from "lucide-react";

// direction: 'up' | 'down' | null (no change / unknown yet)
export default function RankArrow({ direction }) {
  if (direction === "up") {
    return (
      <span className="flex items-center text-gdg-green">
        <ArrowUp size={13} />
      </span>
    );
  }
  if (direction === "down") {
    return (
      <span className="flex items-center text-gdg-red">
        <ArrowDown size={13} />
      </span>
    );
  }
  return (
    <span className="flex items-center text-gray-300 dark:text-gray-600">
      <Minus size={13} />
    </span>
  );
}
