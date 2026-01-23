import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileEdit, Upload, Eye, Send } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  variant: "default" | "accent" | "outline";
  href: string;
}

const actions: QuickAction[] = [
  {
    title: "Continue FPMS Form",
    description: "Resume editing your current submission",
    icon: FileEdit,
    variant: "default",
    href: "/fpms",
  },
  {
    title: "Upload Evidence",
    description: "Add supporting documents",
    icon: Upload,
    variant: "outline",
    href: "/evidence",
  },
  {
    title: "Preview Submission",
    description: "Review before final submission",
    icon: Eye,
    variant: "outline",
    href: "/preview",
  },
  {
    title: "Submit for Review",
    description: "Send to HOD for approval",
    icon: Send,
    variant: "accent",
    href: "/submit",
  },
];

export function QuickActions() {
  return (
    <Card >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            
            className="h-auto justify-start gap-4 p-4"
            asChild
          >
            <a href={action.href}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">{action.title}</p>
                <p className="text-xs opacity-70">{action.description}</p>
              </div>
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
