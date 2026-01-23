import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, FileText, Upload, Info } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const subCriteria = [
  {
    id: "5.1",
    title: "Industry Collaboration/MoU",
    maxPoints: 12,
    currentPoints: 0,
    description: "Guest speakers, internship monitoring",
    status: "not-started",
  },
  {
    id: "5.2",
    title: "University MoU + Implementation",
    maxPoints: 5,
    currentPoints: 0,
    description: "Tangible outcomes required",
    status: "not-started",
  },
  {
    id: "5.3",
    title: "Special Labs/CoE",
    maxPoints: 8,
    currentPoints: 0,
    description: "Coordinator/co-coordinator roles",
    status: "not-started",
  },
  {
    id: "5.4",
    title: "Software/Apps/Hardware/Alumni",
    maxPoints: 8,
    currentPoints: 0,
    description: "Development or alumni engagement",
    status: "not-started",
  },
  {
    id: "5.5",
    title: "Institutional/Dept Responsibilities",
    maxPoints: 12,
    currentPoints: 0,
    description: "Institutional vs dept claim rule",
    status: "not-started",
  },
];

export default function InstitutionalDevelopment() {
  const totalMax = subCriteria.reduce((sum, sc) => sum + sc.maxPoints, 0);
  const totalCurrent = subCriteria.reduce((sum, sc) => sum + sc.currentPoints, 0);
  const progress = totalMax > 0 ? (totalCurrent / totalMax) * 100 : 0;
  const completedCount = subCriteria.filter((sc) => sc.status === "completed").length;
  const evidenceCount = 0; // To be connected to real upload state later

  return (
    <DashboardLayout title="Institutional Development" subtitle="Criterion 5 • Maximum 45 Points" currentPath="/fpms/institutional">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Institutional Development</h1>
              <p className="text-muted-foreground">Criterion 5 • Maximum 45 Points</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
          </div>
        </div>

        {/* Overall Progress Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">
                {totalCurrent} / {totalMax} points
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex flex-col sm:flex-row sm:justify-between mt-4 text-sm text-muted-foreground gap-2">
              <span>{completedCount} of {subCriteria.length} sub-criteria completed</span>
              <span>{evidenceCount} evidence files uploaded</span>
            </div>
          </CardContent>
        </Card>

        {/* Sub-criteria Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {subCriteria.map((sc) => (
            <AccordionItem
              key={sc.id}
              value={sc.id}
              className="border rounded-xl shadow-sm bg-card"
            >
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono text-sm">
                      {sc.id}
                    </Badge>
                    <div className="text-left">
                      <p className="font-medium text-base">{sc.title}</p>
                      <p className="text-sm text-muted-foreground">{sc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {sc.currentPoints} / {sc.maxPoints} pts
                    </Badge>
                    <Badge
                      variant={
                        sc.status === "completed"
                          ? "default"
                          : sc.status === "in-progress"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {sc.status === "not-started"
                        ? "Not Started"
                        : sc.status === "in-progress"
                        ? "In Progress"
                        : "Completed"}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pt-4 pb-8">
                <div className="space-y-6">
                  {/* Guidelines Info Box */}
                  <div className="bg-muted/50 rounded-lg p-4 flex gap-3">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Scoring Guidelines</p>
                      <p className="text-muted-foreground">
                        Complete the required activities and upload supporting evidence to earn points.
                      </p>
                    </div>
                  </div>

                  {/* Claim Entry & Evidence Upload Cards */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Claim Entry
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          No claims added yet
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Add Claim
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Evidence Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          No evidence uploaded
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Upload Evidence
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}