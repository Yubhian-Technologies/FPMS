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
import { FileText, Clock, Folder, File, Award, User, Building, BookOpen } from "lucide-react";
import { api } from "@/api/api";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="mb-6">
      <Card className={`border-l-4 ${isOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
        <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Clock className={`h-6 w-6 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`} />
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
              <div className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                {isOverdue
                  ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`
                  : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
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

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              College → Role → Staff Overview
            </CardTitle>
            
            <CardDescription>Browse institutions, roles, staff, and their detailed submissions</CardDescription>
          </CardHeader>

          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(groupedData).map(([collegeName, roles]: any) => (
                <AccordionItem key={collegeName} value={collegeName} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="bg-muted/40 px-6 py-4 text-xl font-bold hover:no-underline">
                    {collegeName}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-4">
                    <Accordion type="multiple" className="space-y-3">
                      {Object.entries(roles).map(([roleName, staffArray]: any) => (
                        <AccordionItem key={roleName} value={`${collegeName}-${roleName}`} className="border rounded-md">
                          <AccordionTrigger className="px-5 py-3 text-lg font-semibold capitalize ">
                            {roleName}
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-4">
                            <Accordion type="multiple">
                              {staffArray.map((staff: any) => (
                                <AccordionItem key={staff.id} value={staff.id} className="my-2">
                                  <AccordionTrigger className="px-4 py-3  rounded-md">
                                    <div className="flex items-center gap-3">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      {staff.name}
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 pt-4 pb-6">
                                    <div className="space-y-6">

                                      {/* STAFF DETAILS */}
                                      <div className="border rounded-lg p-6 bg-card space-y-3 shadow-sm">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                          <User className="h-5 w-5 text-primary" /> Staff Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div><span className="font-medium">Name:</span> {staff.name}</div>
                                          <div><span className="font-medium">Email:</span> {staff.email}</div>
                                          <div><span className="font-medium">Department:</span> {staff.department || "N/A"}</div>
                                          <div><span className="font-medium">College:</span> {staff.college}</div>
                                          <div><span className="font-medium">Level:</span> {staff.level || "N/A"}</div>
                                        </div>
                                      </div>

                                      {/* SUBMISSIONS */}
                                      <div>
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                          <Award className="h-5 w-5 text-primary" /> Submissions
                                        </h3>

                                        {!staff.submissions || staff.submissions.length === 0 ? (
                                          <div className="text-muted-foreground italic py-6 text-center border border-dashed rounded-lg">
                                            No submissions yet
                                          </div>
                                        ) : (
                                          <Accordion type="multiple" className="space-y-2">
                                            {staff.submissions.map((sub: any) => (
                                              <AccordionItem key={sub.id} value={sub.id} className="border rounded-md">
                                                <AccordionTrigger className="px-5 py-3">
                                                  {sub.taskName}
                                                </AccordionTrigger>
                                                <AccordionContent className="px-5 pb-5 pt-3">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-muted/30 p-5 rounded-lg border">
                                                    <div className="space-y-2">
                                                      <p className="flex items-center gap-2"><File className="h-4 w-4" /> <span className="font-medium">Form:</span> {sub.formTitle}</p>
                                                      <p className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> <span className="font-medium">Module:</span> {sub.moduleName}</p>
                                                      <p className="flex items-center gap-2"><Folder className="h-4 w-4" /> <span className="font-medium">Criteria:</span> {sub.criteriaName}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                      <p><span className="font-medium">Claimed Score:</span> {sub.claimedScore}</p>
                                                      <p><span className="font-medium">Reviewer Score:</span> {sub.reviewerScore ?? "Not Reviewed"}</p>
                                                      <p><span className="font-medium">Final Score:</span> {sub.finalScore ?? "Pending"}</p>
                                                      <p><span className="font-medium">Max Marks:</span> {sub.maxMarks}</p>
                                                    </div>
                                                  </div>

                                                  <div className="mt-4 flex items-center gap-3">
                                                    <Badge
                                                      variant={statusConfig[sub.status]?.variant || "outline"}
                                                      className="text-sm px-4 py-1"
                                                    >
                                                      {statusConfig[sub.status]?.label || sub.status}
                                                    </Badge>
                                                    {sub.status === "appealed" && (
                                                      <Badge variant="outline" className="text-amber-600 border-amber-400">
                                                        Appeal Pending
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </AccordionContent>
                                              </AccordionItem>
                                            ))}
                                          </Accordion>
                                        )}
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
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

  return (
    <DashboardLayout
      title={`${displayName}'s Dashboard`}
      subtitle={`Welcome back, ${displayName.split(" ")[0]}!`}
    >
      {/* Deadline shown only for non-committee roles */}
      {deadline && user?.role !== "committee" && <DeadlineBanner />}

      <div className="space-y-8">
        {/* Submissions Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              My Submissions
            </CardTitle>
            
            <CardDescription>Grouped by Criteria and Module</CardDescription>
          </CardHeader>

          <CardContent>
            {Object.keys(groupedSubmissions).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                No submissions found
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {Object.entries(groupedSubmissions).map(([criteria, modules]: any) => (
                  <AccordionItem key={criteria} value={criteria} className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="bg-muted/50 px-6 py-4 text-lg font-semibold">
                      {criteria}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <Accordion type="multiple" className="space-y-3">
                        {Object.entries(modules).map(([moduleName, subs]: any) => (
                          <AccordionItem key={moduleName} value={`${criteria}-${moduleName}`} className="border rounded-md">
                            <AccordionTrigger className="px-5 py-3 bg-secondary/20">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                {moduleName}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {subs.length} item{subs.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5 pt-3">
                              <div className="space-y-4">
                                {subs.map((sub: any) => (
                                  <div
                                    key={sub.id}
                                    className="border rounded-lg p-5 bg-card shadow-sm hover:shadow transition-shadow"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="font-medium text-base">{sub.taskName}</h4>
                                      <Badge
                                        variant={statusConfig[sub.status]?.variant || "outline"}
                                        className="text-xs px-3 py-0.5"
                                      >
                                        {statusConfig[sub.status]?.label || sub.status}
                                      </Badge>
                                    </div>

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
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
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