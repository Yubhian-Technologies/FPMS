import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, MessageSquare, CheckCircle, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "submission" | "upload" | "review" | "approval" | "appeal";
  title: string;
  description: string;
  time: string;
  status?: "pending" | "approved" | "draft";
}

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "upload",
    title: "Evidence Uploaded",
    description: "Publication certificate for IEEE journal paper",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "submission",
    title: "Research Section Updated",
    description: "Added 2 new publications for R&C category",
    time: "5 hours ago",
    status: "draft",
  },
  {
    id: "3",
    type: "review",
    title: "HOD Review Requested",
    description: "Teaching & Learning section submitted for review",
    time: "1 day ago",
    status: "pending",
  },
  {
    id: "4",
    type: "approval",
    title: "Section Approved",
    description: "Professional Development section approved by HOD",
    time: "2 days ago",
    status: "approved",
  },
];

const iconMap = {
  submission: FileText,
  upload: Upload,
  review: Clock,
  approval: CheckCircle,
  appeal: MessageSquare,
};

export function RecentActivity() {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div 
              key={activity.id}
              className="flex items-start gap-4 border-b border-border py-4 last:border-0 last:pb-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  {activity.status && (
                    <Badge variant={
      activity.status === "approved" ? "default" : 
      activity.status === "pending" ? "secondary" : 
      "outline"  // for "draft"
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
        })}
      </CardContent>
    </Card>
  );
}
