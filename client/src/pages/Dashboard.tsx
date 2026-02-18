import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { ScoreOverview } from "@/components/dashboard/ScoreOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DeadlineAlert } from "@/components/dashboard/DeadlineAlert";
import { FPMSFormOverview } from "@/components/fpms/FPMSFormOverview";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import { FileText, Clock } from "lucide-react";
import { api } from "@/api/api";
import jsPDF from "jspdf";

/* ---------------- STATUS CONFIG ---------------- */

const statusConfig: Record<string, { label: string; variant: any }> = {
  pending: { label: "Pending", variant: "outline" },
  submitted: { label: "Submitted", variant: "secondary" },
  reviewed: { label: "Under Review", variant: "default" },
  accepted: { label: "Accepted", variant: "success" },
  appealed: { label: "Appealed", variant: "warning" },
  "appeal-resolved": { label: "Appeal Resolved", variant: "success" },
};

/* ---------------- PAGE ---------------- */

export default function Dashboard() {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.name || user?.email || "User";

  /* ---------------- FETCH (same as submissions.tsx) ---------------- */

  useEffect(() => {
    if (!user) return;

    const fetchSubmissions = async () => {
      try {
        const response = await api.get("/api/submissions/my-submissions", {
          headers: {
            "x-user-id": user.uid || user.id,
            "x-user-email": user.email || "",
            "x-user-name": user.name || "",
            "x-user-role": user.role || "faculty",
            "x-college": user.college || "",
            "x-department": user.department || "",
          },
        });

        if (response.data?.success) {
          const sorted = [...(response.data.data || [])].sort((a, b) => {
            const ta = a.createdAt?.seconds * 1000 || 0;
            const tb = b.createdAt?.seconds * 1000 || 0;
            return tb - ta;
          });

          setSubmissions(sorted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  /* ---------------- TOTALS (same logic) ---------------- */

  const totalClaimed = submissions.reduce((s, x) => s + x.claimedScore, 0);
  const totalFinal = submissions.reduce((s, x) => s + (x.finalScore ?? 0), 0);
  const totalMax = submissions.reduce((s, x) => s + x.maxMarks, 0);

  const percentage =
    totalMax > 0 ? Math.round((totalFinal / totalMax) * 100) : 0;

  /* ---------------- GROUPING (same logic) ---------------- */

  const groupedDetailed = submissions.reduce((acc: any, sub) => {
    const crit = sub.criteriaName || "Unknown Criteria";
    const mod = sub.moduleName || "Unknown Module";

    if (!acc[crit]) acc[crit] = { modules: {} };
    if (!acc[crit].modules[mod]) acc[crit].modules[mod] = [];

    acc[crit].modules[mod].push(sub);
    return acc;
  }, {});

  /* ---------------- PDF ---------------- */

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.text("FPMS Dashboard Report", 20, 20);
    doc.text(`Total Final: ${totalFinal}/${totalMax}`, 20, 40);
    doc.save("fpms-dashboard-report.pdf");
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Clock className="animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <DashboardLayout
      title={`${displayName}'s Dashboard`}
      subtitle={`Welcome back, ${displayName.split(" ")[0]}!`}
    >
      <div className="space-y-6">

        <DeadlineAlert />
        <StatusCards submissions={submissions} />

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <ScoreOverview submissions={submissions} />

            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Submission Performance</CardTitle>
                  <CardDescription>Live score summary</CardDescription>
                </div>

                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-3xl font-bold text-primary">
                  {totalFinal}
                  <span className="text-muted-foreground text-lg">
                    /{totalMax}
                  </span>
                </p>

                <Progress value={percentage} />

                <p className="text-sm text-muted-foreground">
                  Achievement: {percentage}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 lg:col-span-2">
            <QuickActions />
            <RecentActivity submissions={submissions} />
          </div>
        </div>

        {/* FPMS FORM OVERVIEW */}
        <FPMSFormOverview submissions={submissions} />

        {/* DYNAMIC SUBMISSIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Submissions</CardTitle>
            <CardDescription>
              Auto-generated from submissions
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Accordion type="single" collapsible>
              {Object.entries(groupedDetailed).map(([criteriaName, crit]: any) => (
                <AccordionItem key={criteriaName} value={criteriaName}>
                  <AccordionTrigger>{criteriaName}</AccordionTrigger>

                  <AccordionContent>
                    {Object.entries(crit.modules).map(
                      ([moduleName, tasks]: any) => (
                        <div key={moduleName} className="mb-4">
                          <p className="font-semibold">{moduleName}</p>

                          {tasks.map((sub: any) => (
                            <div
                              key={sub.id}
                              className="flex justify-between border rounded-lg p-3 mt-2"
                            >
                              <div>
                                <p className="font-medium">{sub.taskName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {sub.finalScore ?? sub.claimedScore}/
                                  {sub.maxMarks}
                                </p>
                              </div>

                              <Badge
                                variant={
                                  statusConfig[sub.status]?.variant || "outline"
                                }
                              >
                                {statusConfig[sub.status]?.label ||
                                  sub.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
