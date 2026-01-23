import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, ArrowRight } from "lucide-react";

export function DeadlineAlert() {
  const daysRemaining = 12;
  const deadline = "January 15, 2025";

  return (
    <Card className="overflow-hidden border-0  text-primary">
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Submission Deadline</p>
            <p className="text-lg font-bold">{deadline}</p>
            <p className="text-sm text-primary">
              {daysRemaining} days remaining
            </p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          className="bg-primary text-white hover:bg-primary-foreground/90"
        >
          Complete Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
