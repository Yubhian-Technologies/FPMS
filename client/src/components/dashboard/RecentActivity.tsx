import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, MessageSquare, CheckCircle, Clock } from "lucide-react";

interface RecentActivityProps {
  submissions: any[];
}

export function RecentActivity({ submissions }: RecentActivityProps) {
  // Map submissions to activity items
  const activities = (submissions || [])
    .slice(0, 5) // Get latest 5
    .map((sub) => ({
      id: sub.id,
      type: (sub.status === "appealed" ? "appeal" : 
             sub.status === "accepted" || sub.status === "appeal-resolved" ? "approval" : 
             sub.evidence ? "upload" : "submission") as any,
      title: sub.taskName,
      description: sub.moduleName,
      time: sub.createdAt?.seconds 
        ? new Date(sub.createdAt.seconds * 1000).toLocaleString()
        : "Recent",
      status: sub.status,
    }));

  const iconMap = {
    submission: FileText,
    upload: Upload,
    review: Clock,
    approval: CheckCircle,
    appeal: MessageSquare,
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No recent activity</p>
        ) : (
          activities.map((activity, index) => {
            const Icon = iconMap[activity.type as keyof typeof iconMap] || FileText;
            return (
              <div 
                key={activity.id}
                className="flex items-start gap-4 border-b border-border py-4 last:border-0 last:pb-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1 cursor-pointer hover:bg-muted/30 p-1 rounded-md transition-colors" onClick={() => window.location.href = '/submissions'}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    {activity.status && (
                      <Badge variant={
                        activity.status === "accepted" || activity.status === "appeal-resolved" ? "success" : 
                        activity.status === "submitted" || activity.status === "reviewed" ? "secondary" : 
                        "outline" as any
                      } className="text-xs">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground/70">{activity.time}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
