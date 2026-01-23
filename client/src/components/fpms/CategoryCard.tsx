import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  score: number;
  maxScore: number;
  completedItems: number;
  totalItems: number;
  status: "not-started" | "in-progress" | "complete" | "needs-review";
  href: string;
}

const statusConfig = {
  "not-started": { label: "Not Started", variant: "muted" as const, icon: AlertCircle },
  "in-progress": { label: "In Progress", variant: "pending" as const, icon: AlertCircle },
  "complete": { label: "Complete", variant: "approved" as const, icon: CheckCircle2 },
  "needs-review": { label: "Needs Review", variant: "warning" as const, icon: AlertCircle },
};

export function CategoryCard({
  title,
  description,
  score,
  maxScore,
  completedItems,
  totalItems,
  status,
  href,
}: CategoryCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const progressPercent = (completedItems / totalItems) * 100;

  return (
    <Card  className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Badge  className="shrink-0">
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Score</p>
            <p className="text-2xl font-bold text-foreground">
              {score}
              <span className="text-base font-normal text-muted-foreground">/{maxScore}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Items Completed</p>
            <p className="text-lg font-semibold text-foreground">
              {completedItems}/{totalItems}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Action Button */}
        <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary" asChild>
          <a href={href}>
            {status === "not-started" ? "Start Section" : "Continue Editing"}
            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
