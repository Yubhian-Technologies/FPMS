import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Folder, File, Award, User, Building, BookOpen, Users, School, CheckCircle, AlertCircle, BarChart2 } from "lucide-react";
import { api } from "@/api/api";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

/* ---------------- STATUS CONFIG ---------------- */
const statusConfig: Record<string, { label: string; variant: "outline" | "secondary" | "default" | "success" | "warning" | "destructive" }> = {
  pending:        { label: "Pending",       variant: "outline" },
  submitted:      { label: "Submitted",     variant: "secondary" },
  reviewed:       { label: "Under Review",  variant: "default" },
  accepted:       { label: "Accepted",      variant: "success" },
  appealed:       { label: "Appealed",      variant: "warning" },
  "appeal-resolved": { label: "Appeal Resolved", variant: "success" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [committeeData, setCommitteeData] = useState<any>(null);

  const displayName = user?.name || user?.email || "User";

  /* ---------------- FETCH DEADLINE ---------------- */
  const fetchDeadline = async () => {
    if (!user) return;
    try {
      const res = await api.get("/api/colleges/user-deadline", {
        headers: {
          "x-user-id": user.uid,
          "x-user-role": user.role,
          "x-college": user.college,
        },
      });
      if (res.data.success) {
        setDeadline(res.data.data.deadline);
      }
    } catch (err) {
      console.error("Deadline fetch error:", err);
    }
  };

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (user.role === "committee") {
          const res = await api.get("/api/auth/dashboard-data", {
            headers: { "x-user-id": user.uid, "x-user-role": user.role },
          });
          if (res.data.success) setCommitteeData(res.data.data);
        } else if (user.role === "principle" || user.role === "vice principle") {
          const res = await api.get("/api/admin/college-dashboard", {
            headers: { "x-user-id": user.uid, "x-user-role": user.role },
          });
          console.log("PRINCIPAL DASHBOARD:", res.data);
          if (res.data.success) setCommitteeData(res.data.data);
        } else if (user.role === "hod") {
          const res = await api.get("/api/hod/hod-dashboard", {
            headers: {
              "x-user-id": user.uid,
              "x-user-role": user.role,
              "x-college": user.college,
              "x-department": user.department,
            },
          });
          console.log("HOD DASHBOARD:", res.data);
          if (res.data.success) setCommitteeData(res.data.data);
        } else {
          // Faculty / other roles
          const res = await api.get("/api/submissions/my-submissions", {
            headers: {
              "x-user-id": user.uid,
              "x-user-email": user.email || "",
              "x-user-name": user.name || "",
              "x-user-role": user.role,
              "x-college": user.college || "",
              "x-department": user.department || "",
            },
          });
          console.log(res.data);
          if (res.data.success) {
            const sorted = [...(res.data.data || [])].sort(
              (a, b) => (b.createdAt?.seconds || 0) * 1000 - (a.createdAt?.seconds || 0) * 1000
            );
            setSubmissions(sorted);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchDeadline();
  }, [user]);

  /* ---------------- PDF DOWNLOAD ---------------- */
  const downloadReport = () => {
    const doc = new jsPDF();
    doc.text("FPMS Dashboard Report", 20, 20);

    let allSubs: any[] = [];
    if (user?.role === "committee") {
      if (committeeData?.colleges) {
        committeeData.colleges.forEach((college: any) => {
          college.staff?.forEach((staff: any) => {
            allSubs.push(...(staff.submissions || []));
          });
        });
      }
    } else {
      allSubs = submissions;
    }

    const totalFinal = allSubs.reduce((sum, x) => sum + (x.finalScore ?? 0), 0);
    const totalMax   = allSubs.reduce((sum, x) => sum + (x.maxMarks ?? 0),   0);

    doc.text(`Total Final: ${totalFinal}/${totalMax}`, 20, 40);
    doc.save("fpms-dashboard-report.pdf");
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
          <Clock className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Helper to calculate days remaining
  const getDaysRemaining = (deadlineStr: string | null) => {
    if (!deadlineStr) return null;
    const due = new Date(deadlineStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(deadline);
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  const DeadlineBanner = () => (
    <Card className={`mb-6 border-l-4 ${isOverdue ? 'border-l-destructive bg-destructive/5' : 'border-l-warning bg-warning/5'}`}>
      <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Clock className={`h-6 w-6 ${isOverdue ? 'text-destructive' : 'text-warning'}`} />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Submission Deadline</p>
            <p className="text-lg font-semibold">
              {deadline ? new Date(deadline).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              }) : "—"}
            </p>
          </div>
        </div>
        <div className="text-right">
          {daysRemaining !== null && (
            <div className={`text-lg font-bold ${isOverdue ? 'text-destructive' : 'text-warning-foreground'}`}>
              {isOverdue
                ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`
                : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  /* ────────────────────────────────────────────────
     COMMITTEE / PRINCIPAL / VICE PRINCIPAL / HOD VIEW
  ──────────────────────────────────────────────── */
  if (
    user?.role === "committee" ||
    user?.role === "principle" ||
    user?.role === "vice principle" ||
    user?.role === "hod"
  ) {
    const staffList = committeeData?.staff || [];
    const groupedData = staffList.reduce((acc: any, staff: any) => {
      const collegeName = staff.college || "Unknown College";
      const roleName    = staff.role    || "Unknown Role";

      if (!acc[collegeName]) acc[collegeName] = {};
      if (!acc[collegeName][roleName]) acc[collegeName][roleName] = [];
      acc[collegeName][roleName].push(staff);
      return acc;
    }, {});

    // Calculate summary stats
    const totalColleges = Object.keys(groupedData).length;
    const totalRoles = [...new Set(staffList.map((s: any) => s.role))].length;
    const totalStaff = staffList.length;
    let totalSubmissions = 0;
    let totalFinalScore = 0;
    let totalMaxMarks = 0;
    let totalAppealed = 0;
    let totalCompleted = 0;
    staffList.forEach((staff: any) => {
      staff.submissions?.forEach((sub: any) => {
        totalSubmissions++;
        totalFinalScore += sub.finalScore ?? 0;
        totalMaxMarks += sub.maxMarks ?? 0;
        if (sub.status === "appealed") totalAppealed++;
        if (sub.status === "accepted" || sub.status === "appeal-resolved") totalCompleted++;
      });
    });
    const overallProgress = totalMaxMarks > 0 ? (totalFinalScore / totalMaxMarks) * 100 : 0;
    const completionRate = totalSubmissions > 0 ? (totalCompleted / totalSubmissions) * 100 : 0;

    return (
      <DashboardLayout
        title={`${displayName}'s Dashboard`}
        subtitle={
          user.role === "principle" ? "Principal View" :
          user.role === "vice principle" ? "Vice Principal View" :
          user.role === "hod" ? "HOD View" : "Committee View"
        }
      >
        {/* Deadline shown only for non-committee roles */}
        {deadline && user?.role !== "committee" && <DeadlineBanner />}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                Total Colleges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalColleges}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total Roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRoles}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Total Staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStaff}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Total Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Appealed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAppealed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Overall Performance
            </CardTitle>
            <CardDescription>Total final scores across all submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Score: {totalFinalScore} / {totalMaxMarks}</span>
                <Badge variant="secondary">{overallProgress.toFixed(1)}%</Badge>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <Separator className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Completion Rate:</span> {completionRate.toFixed(1)}%</div>
                <div><span className="font-medium">Appealed Submissions:</span> {totalAppealed}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              College → Role → Staff Overview
            </CardTitle>
            <CardDescription>Browse institutions, roles, staff, and their detailed submissions with counts</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(groupedData).map(([collegeName, roles]: any) => {
                const collegeStaffCount = Object.values(roles).reduce((sum: number, staffArray: any) => sum + staffArray.length, 0);
                const collegeRolesCount = Object.keys(roles).length;
                return (
                  <AccordionItem key={collegeName} value={collegeName} className="border rounded-lg overflow-hidden shadow-sm">
                    <AccordionTrigger className="bg-muted/30 px-6 py-4 text-xl font-bold hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between w-full pr-4">
                        <span>{collegeName}</span>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {collegeRolesCount} Roles</span>
                          <span className="flex items-center gap-1"><User className="h-4 w-4" /> {collegeStaffCount} Staff</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-4 bg-background">
                      <Accordion type="multiple" className="space-y-3">
                        {Object.entries(roles).map(([roleName, staffArray]: any) => {
                          const roleStaffCount = staffArray.length;
                          return (
                            <AccordionItem key={roleName} value={`${collegeName}-${roleName}`} className="border rounded-md shadow-inner">
                              <AccordionTrigger className="px-5 py-3 text-lg font-semibold capitalize bg-secondary/10 hover:bg-secondary/20 transition-colors">
                                <div className="flex justify-between w-full pr-4">
                                  <span>{roleName}</span>
                                  <Badge variant="outline" className="text-sm">{roleStaffCount} Staff</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-5 pb-4 bg-background">
                                <Accordion type="multiple">
                                  {staffArray.map((staff: any) => {
                                    const staffSubmissionsCount = staff.submissions?.length || 0;
                                    let staffTotalFinal = 0;
                                    let staffTotalMax = 0;
                                    let staffTotalClaimed = 0;
                                    let staffTotalReviewer = 0;
                                    let staffAppealedCount = 0;
                                    let staffCompletedCount = 0;
                                    staff.submissions?.forEach((sub: any) => {
                                      staffTotalFinal += sub.finalScore ?? 0;
                                      staffTotalMax += sub.maxMarks ?? 0;
                                      staffTotalClaimed += sub.claimedScore ?? 0;
                                      staffTotalReviewer += sub.reviewerScore ?? 0;
                                      if (sub.status === "appealed") staffAppealedCount++;
                                      if (sub.status === "accepted" || sub.status === "appeal-resolved") staffCompletedCount++;
                                    });
                                    const staffProgress = staffTotalMax > 0 ? (staffTotalFinal / staffTotalMax) * 100 : 0;
                                    const staffCompletionRate = staffSubmissionsCount > 0 ? (staffCompletedCount / staffSubmissionsCount) * 100 : 0;

                                    // Group submissions by criteria > module
                                    const groupedSubmissions = (staff.submissions || []).reduce((acc: any, sub: any) => {
                                      const crit = sub.criteriaName || "Other Criteria";
                                      const mod = sub.moduleName || "General";

                                      if (!acc[crit]) acc[crit] = {};
                                      if (!acc[crit][mod]) acc[crit][mod] = [];
                                      acc[crit][mod].push(sub);
                                      return acc;
                                    }, {});

                                    return (
                                      <AccordionItem key={staff.id} value={staff.id} className="my-2 border rounded-md shadow-sm">
                                        <AccordionTrigger className="px-4 py-3 bg-muted/20 hover:bg-muted/30 rounded-md transition-colors">
                                          <div className="flex justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                              <User className="h-4 w-4 text-muted-foreground" />
                                              {staff.name}
                                            </div>
                                            <Badge variant="outline" className="text-xs">{staffSubmissionsCount} Submissions</Badge>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pt-4 pb-6 bg-background">
                                          <div className="space-y-6">
                                            {/* STAFF DETAILS */}
                                            <Card className="border shadow-sm">
                                              <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                  <User className="h-5 w-5 text-primary" /> Staff Details
                                                </CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                  <div><span className="font-medium">Name:</span> {staff.name}</div>
                                                  <div><span className="font-medium">Email:</span> {staff.email}</div>
                                                  <div><span className="font-medium">Department:</span> {staff.department || "N/A"}</div>
                                                  <div><span className="font-medium">College:</span> {staff.college}</div>
                                                  <div><span className="font-medium">Level:</span> {staff.level || "N/A"}</div>
                                                  <div><span className="font-medium">Role:</span> {staff.role || "N/A"}</div>
                                                </div>
                                              </CardContent>
                                            </Card>

                                            {/* STAFF PERFORMANCE SUMMARY */}
                                            <Card className="border shadow-sm">
                                              <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                  <BarChart2 className="h-5 w-5 text-primary" /> Performance Summary
                                                </CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                <div className="space-y-4">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Overall Score: {staffTotalFinal} / {staffTotalMax}</span>
                                                    <Badge variant="secondary">{staffProgress.toFixed(1)}%</Badge>
                                                  </div>
                                                  <Progress value={staffProgress} className="h-2" />
                                                  <Separator className="my-4" />
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                    <div><span className="font-medium">Claimed Total:</span> {staffTotalClaimed}</div>
                                                    <div><span className="font-medium">Reviewer Total:</span> {staffTotalReviewer}</div>
                                                    <div><span className="font-medium">Final Total:</span> {staffTotalFinal}</div>
                                                    <div><span className="font-medium">Completion Rate:</span> {staffCompletionRate.toFixed(1)}%</div>
                                                    <div><span className="font-medium">Appealed:</span> {staffAppealedCount}</div>
                                                    <div><span className="font-medium">Completed:</span> {staffCompletedCount}</div>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>

                                            {/* SUBMISSIONS */}
                                            <Card className="border shadow-sm">
                                              <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                  <Award className="h-5 w-5 text-primary" /> Submissions ({staffSubmissionsCount})
                                                </CardTitle>
                                                <CardDescription>Grouped by Criteria and Module with detailed views</CardDescription>
                                              </CardHeader>
                                              <CardContent>
                                                {Object.keys(groupedSubmissions).length === 0 ? (
                                                  <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                                                    No submissions found
                                                  </div>
                                                ) : (
                                                  <Accordion type="multiple" className="space-y-4">
                                                    {Object.entries(groupedSubmissions).map(([criteria, modules]: any) => {
                                                      const criteriaModulesCount = Object.keys(modules).length;
                                                      const criteriaSubsCount = Object.values(modules).reduce((sum: number, subs: any) => sum + subs.length, 0);
                                                      return (
                                                        <AccordionItem key={criteria} value={criteria} className="border rounded-lg overflow-hidden shadow-sm">
                                                          <AccordionTrigger className="bg-muted/30 px-6 py-4 text-lg font-semibold hover:bg-muted/50 transition-colors">
                                                            <div className="flex justify-between w-full pr-4">
                                                              <span>{criteria}</span>
                                                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {criteriaModulesCount} Modules</span>
                                                                <span className="flex items-center gap-1"><File className="h-4 w-4" /> {criteriaSubsCount} Submissions</span>
                                                              </div>
                                                            </div>
                                                          </AccordionTrigger>
                                                          <AccordionContent className="px-6 pb-6 pt-2 bg-background">
                                                            <Accordion type="multiple" className="space-y-3">
                                                              {Object.entries(modules).map(([moduleName, subs]: any) => {
                                                                const moduleSubsCount = subs.length;
                                                                return (
                                                                  <AccordionItem key={moduleName} value={`${criteria}-${moduleName}`} className="border rounded-md shadow-inner">
                                                                    <AccordionTrigger className="px-5 py-3 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                                                                      <div className="flex justify-between w-full pr-4">
                                                                        <div className="flex items-center gap-2">
                                                                          <BookOpen className="h-4 w-4 text-primary" />
                                                                          {moduleName}
                                                                        </div>
                                                                        <Badge variant="outline" className="ml-2 text-xs">
                                                                          {moduleSubsCount} item{moduleSubsCount !== 1 ? "s" : ""}
                                                                        </Badge>
                                                                      </div>
                                                                    </AccordionTrigger>
                                                                    <AccordionContent className="px-5 pb-5 pt-3 bg-background">
                                                                      <div className="space-y-4">
                                                                        {subs.map((sub: any) => {
                                                                          const subProgress = sub.maxMarks > 0 ? ((sub.finalScore ?? 0) / sub.maxMarks) * 100 : 0;
                                                                          return (
                                                                            <Card
                                                                              key={sub.id}
                                                                              className="border shadow-sm hover:shadow-md transition-shadow"
                                                                            >
                                                                              <CardHeader className="pb-2">
                                                                                <div className="flex justify-between items-start">
                                                                                  <CardTitle className="text-base">{sub.taskName}</CardTitle>
                                                                                  <Badge
                                                                                    variant={statusConfig[sub.status]?.variant || "outline"}
                                                                                    className="text-xs px-3 py-0.5"
                                                                                  >
                                                                                    {statusConfig[sub.status]?.label || sub.status}
                                                                                  </Badge>
                                                                                </div>
                                                                              </CardHeader>
                                                                              <CardContent>
                                                                                <div className="space-y-4">
                                                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                                                    <p><span className="font-medium">Form:</span> {sub.formTitle}</p>
                                                                                    <p><span className="font-medium">Claimed:</span> {sub.claimedScore}</p>
                                                                                    <p><span className="font-medium">Reviewer:</span> {sub.reviewerScore ?? "—"}</p>
                                                                                    <p><span className="font-medium">Final:</span> {sub.finalScore ?? "Pending"}</p>
                                                                                    <p><span className="font-medium">Max Marks:</span> {sub.maxMarks}</p>
                                                                                    {sub.createdAt && (
                                                                                      <p><span className="font-medium">Submitted:</span> {new Date(sub.createdAt.seconds * 1000).toLocaleDateString()}</p>
                                                                                    )}
                                                                                  </div>
                                                                                  <div className="space-y-2">
                                                                                    <div className="flex justify-between text-sm">
                                                                                      <span>Progress</span>
                                                                                      <span>{subProgress.toFixed(1)}%</span>
                                                                                    </div>
                                                                                    <Progress value={subProgress} className="h-2" />
                                                                                  </div>
                                                                                </div>
                                                                              </CardContent>
                                                                            </Card>
                                                                          );
                                                                        })}
                                                                      </div>
                                                                    </AccordionContent>
                                                                  </AccordionItem>
                                                                );
                                                              })}
                                                            </Accordion>
                                                          </AccordionContent>
                                                        </AccordionItem>
                                                      );
                                                    })}
                                                  </Accordion>
                                                )}
                                              </CardContent>
                                            </Card>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    );
                                  })}
                                </Accordion>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* Download Button */}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={downloadReport} className="gap-2">
            <FileText className="h-4 w-4" />
            Download Report (PDF)
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  /* ────────────────────────────────────────────────
     FACULTY / NORMAL USER VIEW
  ──────────────────────────────────────────────── */
  const groupedSubmissions = submissions.reduce((acc: any, sub: any) => {
    const crit = sub.criteriaName || "Other Criteria";
    const mod  = sub.moduleName    || "General";

    if (!acc[crit]) acc[crit] = {};
    if (!acc[crit][mod]) acc[crit][mod] = [];
    acc[crit][mod].push(sub);
    return acc;
  }, {});

  // Calculate summary stats for faculty
  const totalSubmissions = submissions.length;
  let totalClaimed = 0;
  let totalReviewer = 0;
  let totalFinal = 0;
  let totalMax = 0;
  let completedCount = 0;
  let appealedCount = 0;
  submissions.forEach((sub: any) => {
    totalClaimed += sub.claimedScore ?? 0;
    totalReviewer += sub.reviewerScore ?? 0;
    totalFinal += sub.finalScore ?? 0;
    totalMax += sub.maxMarks ?? 0;
    if (sub.status === "accepted" || sub.status === "appeal-resolved") completedCount++;
    if (sub.status === "appealed") appealedCount++;
  });
  const overallProgress = totalMax > 0 ? (totalFinal / totalMax) * 100 : 0;
  const completionRate = totalSubmissions > 0 ? (completedCount / totalSubmissions) * 100 : 0;

  return (
    <DashboardLayout
      title={`${displayName}'s Dashboard`}
      subtitle={`Welcome back, ${displayName.split(" ")[0]}!`}
    >
      {/* Deadline shown only for non-committee roles */}
      {deadline && user?.role !== "committee" && <DeadlineBanner />}

      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Total Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Completion Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Overall Score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFinal} / {totalMax}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Appealed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appealedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Performance Overview
            </CardTitle>
            <CardDescription>Your total scores and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Progress</span>
                <Badge variant="secondary">{overallProgress.toFixed(1)}%</Badge>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <Separator className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div><span className="font-medium">Claimed Total:</span> {totalClaimed}</div>
                <div><span className="font-medium">Reviewer Total:</span> {totalReviewer}</div>
                <div><span className="font-medium">Final Total:</span> {totalFinal}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              My Submissions
            </CardTitle>
            <CardDescription>Grouped by Criteria and Module with detailed views</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedSubmissions).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                No submissions found
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {Object.entries(groupedSubmissions).map(([criteria, modules]: any) => {
                  const criteriaModulesCount = Object.keys(modules).length;
                  const criteriaSubsCount = Object.values(modules).reduce((sum: number, subs: any) => sum + subs.length, 0);
                  return (
                    <AccordionItem key={criteria} value={criteria} className="border rounded-lg overflow-hidden shadow-sm">
                      <AccordionTrigger className="bg-muted/30 px-6 py-4 text-lg font-semibold hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between w-full pr-4">
                          <span>{criteria}</span>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {criteriaModulesCount} Modules</span>
                            <span className="flex items-center gap-1"><File className="h-4 w-4" /> {criteriaSubsCount} Submissions</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2 bg-background">
                        <Accordion type="multiple" className="space-y-3">
                          {Object.entries(modules).map(([moduleName, subs]: any) => {
                            const moduleSubsCount = subs.length;
                            return (
                              <AccordionItem key={moduleName} value={`${criteria}-${moduleName}`} className="border rounded-md shadow-inner">
                                <AccordionTrigger className="px-5 py-3 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                                  <div className="flex justify-between w-full pr-4">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-primary" />
                                      {moduleName}
                                    </div>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {moduleSubsCount} item{moduleSubsCount !== 1 ? "s" : ""}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-5 pb-5 pt-3 bg-background">
                                  <div className="space-y-4">
                                    {subs.map((sub: any) => {
                                      const subProgress = sub.maxMarks > 0 ? ((sub.finalScore ?? 0) / sub.maxMarks) * 100 : 0;
                                      return (
                                        <Card
                                          key={sub.id}
                                          className="border shadow-sm hover:shadow-md transition-shadow"
                                        >
                                          <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                              <CardTitle className="text-base">{sub.taskName}</CardTitle>
                                              <Badge
                                                variant={statusConfig[sub.status]?.variant || "outline"}
                                                className="text-xs px-3 py-0.5"
                                              >
                                                {statusConfig[sub.status]?.label || sub.status}
                                              </Badge>
                                            </div>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="space-y-4">
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                <p><span className="font-medium">Form:</span> {sub.formTitle}</p>
                                                <p><span className="font-medium">Claimed:</span> {sub.claimedScore}</p>
                                                <p><span className="font-medium">Reviewer:</span> {sub.reviewerScore ?? "—"}</p>
                                                <p><span className="font-medium">Final:</span> {sub.finalScore ?? "Pending"}</p>
                                                <p><span className="font-medium">Max Marks:</span> {sub.maxMarks}</p>
                                                {sub.createdAt && (
                                                  <p><span className="font-medium">Submitted:</span> {new Date(sub.createdAt.seconds * 1000).toLocaleDateString()}</p>
                                                )}
                                              </div>
                                              <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                  <span>Progress</span>
                                                  <span>{subProgress.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={subProgress} className="h-2" />
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Download Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={downloadReport} className="gap-2">
            <FileText className="h-4 w-4" />
            Download Report (PDF)
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}