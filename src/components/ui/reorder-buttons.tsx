import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  index: number;
  total: number;
  onMove: (delta: -1 | 1) => void;
  vertical?: boolean;
}

export function ReorderButtons({ index, total, onMove, vertical = false }: Props) {
  return (
    <div className={vertical ? "flex flex-col" : "flex items-center"}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        title="Move up"
        aria-label="Move up"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={index >= total - 1}
        onClick={() => onMove(1)}
        title="Move down"
        aria-label="Move down"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
