import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Clock, AlertCircle, CheckCircle2, FileText } from "lucide-react";

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

interface StatusCardsProps {
  submissions: any[];
}

export function StatusCards({ submissions }: StatusCardsProps) {
  const pendingReviews = submissions.filter(s => s.status === "submitted" || s.status === "reviewed").length;
  const evidenceUploaded = submissions.filter(s => s.evidence).length;
  const appealsOpen = submissions.filter(s => s.status === "appealed").length;
  
  // Get latest submission for "Current Submission"
  const latestSubmission = submissions.length > 0 ? submissions[0] : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="cursor-pointer" onClick={() => window.location.href = '/fpms-form'}>
        <StatusCard
          title="Current Submission"
          value={latestSubmission ? latestSubmission.status.charAt(0).toUpperCase() + latestSubmission.status.slice(1) : "None"}
          subtitle={latestSubmission ? `Last updated: ${new Date(latestSubmission.createdAt?.seconds * 1000).toLocaleDateString()}` : "No submissions yet"}
          icon={FileText}
          variant="stat"
          badge={latestSubmission ? { text: latestSubmission.status, variant: "draft" } : undefined}
        />
      </div>
      <div className="cursor-pointer" onClick={() => window.location.href = '/submissions'}>
        <StatusCard
          title="Pending Reviews"
          value={pendingReviews}
          subtitle="Awaiting approval"
          icon={Clock}
          variant="warning"
          badge={{ text: "Pending", variant: "pending" }}
        />
      </div>
      <div className="cursor-pointer" onClick={() => window.location.href = '/submissions'}>
        <StatusCard
          title="Evidence Uploaded"
          value={evidenceUploaded}
          subtitle="Across all categories"
          icon={CheckCircle2}
          variant="success"
        />
      </div>
      <div className="cursor-pointer" onClick={() => window.location.href = '/submissions'}>
        <StatusCard
          title="Appeals Open"
          value={appealsOpen}
          subtitle="Active appeals"
          icon={AlertCircle}
          variant="accent"
        />
      </div>
    </div>
  );
}
