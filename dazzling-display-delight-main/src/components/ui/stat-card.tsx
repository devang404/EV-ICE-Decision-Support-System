import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "ev" | "ice" | "primary";
  className?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  suffix = "",
  prefix = "",
  icon: Icon,
  trend,
  variant = "default",
  className,
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;
    
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  const variantStyles = {
    default: "bg-card",
    ev: "bg-gradient-to-br from-ev/10 to-ev/5 border-ev/20",
    ice: "bg-gradient-to-br from-ice/10 to-ice/5 border-ice/20",
    primary: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    ev: "gradient-ev text-white",
    ice: "gradient-ice text-white",
    primary: "gradient-primary text-white",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-500",
        variantStyles[variant],
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">
              {prefix}
              {displayValue.toLocaleString()}
              {suffix}
            </p>
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-ev" : "text-destructive"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-xl p-3", iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
