import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, FileText, Upload, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const subCriteria = [
  { id: "3.1", title: "Attending FDP/Refresher", maxPoints: 10, currentPoints: 0, description: "Offline/hybrid only + reflection report", status: "not-started" },
  { id: "3.2", title: "Organizing FDP/Refresher", maxPoints: 10, currentPoints: 0, description: "Committee caps + expense report", status: "not-started" },
  { id: "3.3", title: "NPTEL/Industry Certifications", maxPoints: 12, currentPoints: 0, description: "Elite Gold/Silver, implementation proof", status: "not-started" },
  { id: "3.4", title: "Industry Certs/VEDIC/IGIP", maxPoints: 10, currentPoints: 0, description: "Professional certifications", status: "not-started" },
  { id: "3.5", title: "Professional Society Activities", maxPoints: 10, currentPoints: 0, description: "Active participation, not membership alone", status: "not-started" },
  { id: "3.6", title: "Academic Outreach", maxPoints: 4, currentPoints: 0, description: "Outside institute activities", status: "not-started" },
  { id: "3.7", title: "Extension/Social Outreach", maxPoints: 4, currentPoints: 0, description: "≥30 students mandatory, committee caps", status: "not-started" },
  { id: "3.8", title: "Awards/Recognitions", maxPoints: 5, currentPoints: 0, description: "Professional awards and recognitions", status: "not-started" },
];

export default function ProfessionalDevelopment() {
  const totalMax = subCriteria.reduce((sum, sc) => sum + sc.maxPoints, 0);
  const totalCurrent = subCriteria.reduce((sum, sc) => sum + sc.currentPoints, 0);
  const progress = totalMax > 0 ? (totalCurrent / totalMax) * 100 : 0;

  return (
    <DashboardLayout title="Professional Development" subtitle="Criterion 3 • Maximum 65 Points" currentPath="/fpms/professional">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Professional Development</h1>
              <p className="text-muted-foreground">Criterion 3 • Maximum 65 Points</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Save className="mr-2 h-4 w-4" />Save Draft</Button>
            <Button><Send className="mr-2 h-4 w-4" />Submit for Review</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{totalCurrent} / {totalMax} points</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4 text-sm text-muted-foreground">
              <span>0 of 8 sub-criteria completed</span>
              <span>0 evidence files uploaded</span>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          {subCriteria.map((sc) => (
            <AccordionItem key={sc.id} value={sc.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono">{sc.id}</Badge>
                    <div className="text-left">
                      <p className="font-medium">{sc.title}</p>
                      <p className="text-sm text-muted-foreground">{sc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{sc.currentPoints} / {sc.maxPoints} pts</Badge>
                    <Badge variant="outline">Not Started</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Scoring Guidelines</p>
                        <p>Complete the required activities and upload supporting evidence.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Claim Entry</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">No claims added yet</p>
                        <Button variant="outline" size="sm" className="w-full">Add Claim</Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" />Evidence Documents</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">No evidence uploaded</p>
                        <Button variant="outline" size="sm" className="w-full">Upload Evidence</Button>
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
