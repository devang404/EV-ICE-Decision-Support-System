import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Fuel } from "lucide-react";

interface ComparisonCardProps {
  type: "ev" | "ice";
  title: string;
  metrics: {
    label: string;
    value: string;
    subValue?: string;
  }[];
  recommended?: boolean;
  className?: string;
}

export function ComparisonCard({
  type,
  title,
  metrics,
  recommended = false,
  className,
}: ComparisonCardProps) {
  const isEV = type === "ev";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        isEV
          ? "border-ev/30 bg-gradient-to-br from-ev/5 to-transparent"
          : "border-ice/30 bg-gradient-to-br from-ice/5 to-transparent",
        recommended && "ring-2 ring-ev shadow-lg shadow-ev/20",
        className
      )}
    >
      {recommended && (
        <div className="absolute right-0 top-0">
          <div className="gradient-ev px-4 py-1 text-xs font-bold text-white rounded-bl-lg">
            RECOMMENDED
          </div>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              isEV ? "gradient-ev" : "gradient-ice"
            )}
          >
            {isEV ? (
              <Zap className="h-6 w-6 text-white" />
            ) : (
              <Fuel className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEV ? "Electric Vehicle" : "Internal Combustion Engine"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <div className="text-right">
              <span className="font-semibold">{metric.value}</span>
              {metric.subValue && (
                <p className="text-xs text-muted-foreground">{metric.subValue}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
