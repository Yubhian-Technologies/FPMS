import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  variant: "stat" | "accent" | "success" | "warning";
  badge?: { text: string; variant: "pending" | "approved" | "draft" };
}

function StatusCard({ title, value, subtitle, icon: Icon, variant, badge }: StatusCardProps) {
  return (
    <Card  className="animate-slide-up">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            {badge && (
              <Badge className="text-xs">
                {badge.text}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        title="Current Submission"
        value="Draft"
        subtitle="Last saved: 2 hours ago"
        icon={FileCheck}
        variant="stat"
        badge={{ text: "In Progress", variant: "draft" }}
      />
      <StatusCard
        title="Pending Reviews"
        value="2"
        subtitle="Awaiting HOD approval"
        icon={Clock}
        variant="warning"
        badge={{ text: "Pending", variant: "pending" }}
      />
      <StatusCard
        title="Evidence Uploaded"
        value="24"
        subtitle="Across 5 categories"
        icon={CheckCircle2}
        variant="success"
      />
      <StatusCard
        title="Appeals Open"
        value="0"
        subtitle="No active appeals"
        icon={AlertCircle}
        variant="accent"
      />
    </div>
  );
}
