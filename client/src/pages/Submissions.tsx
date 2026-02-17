import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Clock,
  CheckCircle2,
  Eye,
  ChevronRight,
  Calendar,
  BookOpen,
  Layers,
  LinkIcon,
  User,
  TrendingUp,
  Award,
  Scale,
  MessageSquare,
  FileCheck,
  Edit,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/api";
import jsPDF from "jspdf";

interface Submission {
  id: string;
  formId: string;
  formTitle: string;
  criteriaId: string;
  criteriaName: string;
  moduleId: string;
  moduleName: string;
  taskId: string;
  taskName: string;
  status: string;
  claimedScore: number;
  finalScore: number | null;
  maxMarks: number;
  createdAt: any;
  updatedAt: any;
  description?: string;
  evidence?: string;
  reviewerScore?: number;
  reviewerReason?: string;
  reviewerId?: string;
  reviewerRole?: string;
  appealReason?: string;
  appealRequestedScore?: number;
  appealerScore?: number;
  appealerReason?: string;
  appealerId?: string;
  appealerRole?: string;
  isAppealed: boolean;
  submitToRoleIds?: string[];
  appealToRoleIds?: string[];
  userName: string;
  userEmail: string;
  userRole: string;
  college: string;
  department: string;
  academicYear?: string;
}

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  submitted: { label: "Submitted", variant: "secondary", icon: Send },
  reviewed: { label: "Under Review", variant: "default", icon: Clock },
  accepted: { label: "Accepted", variant: "success", icon: CheckCircle2 },
  appealed: { label: "Appealed", variant: "warning", icon: Scale },
  "appeal-resolved": { label: "Appeal Resolved", variant: "success", icon: Award },
};

export default function Submissions() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/api/submissions/my-submissions", {
          headers: {
            "x-user-id": user.uid || user.id,
            "x-user-email": user.email || "",
            "x-user-name": user.name || user.displayName || "",
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
        } else {
          setError("Failed to load submissions");
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.response?.data?.message || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, authLoading]);


  const totalClaimed = submissions.reduce((sum, sub) => sum + sub.claimedScore, 0);
  const totalFinal = submissions.reduce((sum, sub) => sum + (sub.finalScore ?? 0), 0);
  const totalMax = submissions.reduce((sum, sub) => sum + sub.maxMarks, 0);

  const groupedDetailed = submissions.reduce((acc, sub) => {
    const crit = sub.criteriaName || "Unknown Criteria";
    const mod = sub.moduleName || "Unknown Module";
    if (!acc[crit]) acc[crit] = { modules: {}, totalClaimed: 0, totalFinal: 0, totalMax: 0 };
    if (!acc[crit].modules[mod]) acc[crit].modules[mod] = { tasks: [], totalClaimed: 0, totalFinal: 0, totalMax: 0 };
    acc[crit].modules[mod].tasks.push(sub);
    acc[crit].modules[mod].totalClaimed += sub.claimedScore;
    acc[crit].modules[mod].totalFinal += (sub.finalScore ?? 0);
    acc[crit].modules[mod].totalMax += sub.maxMarks;
    acc[crit].totalClaimed += sub.claimedScore;
    acc[crit].totalFinal += (sub.finalScore ?? 0);
    acc[crit].totalMax += sub.maxMarks;
    return acc;
  }, {} as Record<string, { modules: Record<string, { tasks: Submission[]; totalClaimed: number; totalFinal: number; totalMax: number }>; totalClaimed: number; totalFinal: number; totalMax: number }>);

  const hasSubmissions = submissions.length > 0;

  
  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FPMS Submissions Report", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, 35);

    doc.setFontSize(14);
    doc.text("User Details", 20, 50);
    doc.setLineWidth(0.3);
    doc.line(20, 53, 190, 53);
    doc.setFontSize(11);
    doc.text(`Name: ${user.name || user.displayName || "Unknown"}`, 25, 62);
    doc.text(`Email: ${user.email}`, 25, 70);
    doc.text(`Role: ${user.role?.toUpperCase() || "Faculty"}`, 25, 78);
    

    let y = 110;
    doc.setFontSize(14);
    doc.text("Overall Scores", 20, y);
    doc.line(20, y + 3, 190, y + 3);
    y += 12;
    doc.setFontSize(11);
    doc.text(`Total Claimed: ${totalClaimed} / ${totalMax}`, 25, y);
    y += 8;
    doc.text(`Total Final: ${totalFinal} / ${totalMax}`, 25, y);
    y += 8;
    doc.text(`Achievement: ${totalMax > 0 ? Math.round((totalFinal / totalMax) * 100) : 0}%`, 25, y);
    y += 15;

    doc.setFontSize(14);
    doc.text("All Submissions", 20, y);
    doc.line(20, y + 3, 190, y + 3);
    y += 12;

    submissions.forEach((sub, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`${idx + 1}. ${sub.taskName}`, 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Criteria: ${sub.criteriaName}`, 25, y);
      y += 7;
      doc.text(`Module: ${sub.moduleName}`, 25, y);
      y += 7;
      doc.text(`Status: ${statusConfig[sub.status]?.label || sub.status}`, 25, y);
      y += 7;
      doc.text(`Claimed: ${sub.claimedScore} / ${sub.maxMarks}`, 25, y);
      y += 7;
      doc.text(`Final: ${sub.finalScore ?? "Pending"}`, 25, y);
      y += 7;
      if (sub.reviewerScore !== undefined) {
        doc.text(`Reviewer: ${sub.reviewerScore} (${sub.reviewerRole?.toUpperCase() || "N/A"})`, 25, y);
        y += 7;
      }
      if (sub.appealerScore !== undefined) {
        doc.text(`Appeal: ${sub.appealerScore} (${sub.appealerRole?.toUpperCase() || "N/A"})`, 25, y);
        y += 7;
      }
      if (sub.description) {
        doc.text(`Description: ${sub.description.substring(0, 120)}...`, 25, y);
        y += 7;
      }
      if (sub.evidence) {
        doc.text(`Evidence: ${sub.evidence.substring(0, 80)}...`, 25, y);
        y += 7;
      }
      if (sub.reviewerReason) {
        doc.text(`Reviewer Remark: ${sub.reviewerReason.substring(0, 120)}...`, 25, y);
        y += 7;
      }
      if (sub.appealReason) {
        doc.text(`Appeal Reason: ${sub.appealReason.substring(0, 120)}...`, 25, y);
        y += 7;
      }
      if (sub.appealerReason) {
        doc.text(`Appeal Resolution: ${sub.appealerReason.substring(0, 120)}...`, 25, y);
        y += 7;
      }
      y += 10;
    });

    doc.save("fpms-submissions-report.pdf");
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="My Submissions">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="h-6 w-6 animate-spin" />
            <span>Loading your submissions...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Submissions">
        <div className="text-center py-16 text-destructive">
          <p className="text-xl font-medium">{error}</p>
          <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Submissions"
      subtitle="Track and manage your FPMS submissions"

    >
      <div className="space-y-10 pb-12">
        {/* Overall Total Score */}
        <Card>
          
          <div className="flex justify-between">
            <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>Total scores from all your submitted tasks</CardDescription>
          </CardHeader>
          <div className="p-7">
          <Button className="h-10 flex gap-2" variant="outline" onClick={downloadReport}>
            <FileText className="h-2 w-6" />
            <span>Download Report</span>
          </Button>
        </div>
          </div>
          
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-muted/50 p-5">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Final Score</p>
                  <p className="text-4xl font-bold text-primary">
                    {totalFinal}
                    <span className="text-xl font-normal text-muted-foreground ml-1">
                      /{totalMax}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-emerald-600">
                    {totalMax > 0 ? Math.round((totalFinal / totalMax) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Achievement</p>
                </div>
              </div>
              <Progress
                value={totalMax > 0 ? (totalFinal / totalMax) * 100 : 0}
                className="h-3"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Claimed</p>
                <p className="font-medium">{totalClaimed} / {totalMax}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Tasks</p>
                <p className="font-medium">{submissions.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Finalized</p>
                <p className="font-medium">
                  {submissions.filter(s => ["accepted", "appeal-resolved"].includes(s.status)).length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pending/Review</p>
                <p className="font-medium">
                  {submissions.length - submissions.filter(s => ["accepted", "appeal-resolved"].includes(s.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

       
        

       
        <Card>
          <CardHeader>
            <CardTitle>Detailed Task Submissions</CardTitle>
            <CardDescription>Grouped by criteria and module</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue={Object.keys(groupedDetailed)[0] || ""}>
              {Object.entries(groupedDetailed).map(([criteriaName, critData]) => (
                <AccordionItem key={criteriaName} value={criteriaName} className="border rounded-lg mb-4">
                  <AccordionTrigger className="px-5 py-4">
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex items-center gap-4">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{criteriaName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {Object.keys(critData.modules).length} modules • {critData.totalFinal} / {critData.totalMax}
                          </p>
                        </div>
                      </div>
                      <Badge  className="font-bold text-sm ">
                        {critData.totalFinal} / {critData.totalMax}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-5 pb-6">
                    <Accordion type="multiple">
                      {Object.entries(critData.modules).map(([moduleName, modData]) => (
                        <AccordionItem key={moduleName} value={`${criteriaName}-${moduleName}`}>
                          <AccordionTrigger>
                            <div className="flex flex-1 items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{moduleName}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {modData.tasks.length} task{modData.tasks.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                              <Badge >
                                {modData.totalFinal} / {modData.totalMax}
                              </Badge>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pt-4 space-y-4">
                            {modData.tasks.map((sub) => (
                              <Card key={sub.id} className="border">
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-base">{sub.taskName}</CardTitle>
                                      <CardDescription className="text-xs mt-1">
                                        {sub.createdAt?.toDate?.()?.toLocaleDateString("en-IN") || "—"}
                                      </CardDescription>
                                    </div>
                                    <Badge variant={statusConfig[sub.status]?.variant}>
                                      {statusConfig[sub.status]?.label || sub.status}
                                    </Badge>
                                  </div>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Claimed</p>
                                      <p className="font-medium">{sub.claimedScore}/{sub.maxMarks}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Final</p>
                                      <p className="font-medium">
                                        {sub.finalScore ?? sub.appealerScore ?? sub.reviewerScore ?? "—"}
                                      </p>
                                    </div>
                                    {sub.reviewerScore !== undefined && (
                                      <div>
                                        <p className="text-xs text-muted-foreground">Reviewer</p>
                                        <p className="font-medium">{sub.reviewerScore}/{sub.maxMarks}</p>
                                      </div>
                                    )}
                                    {sub.appealerScore !== undefined && (
                                      <div>
                                        <p className="text-xs text-muted-foreground">Appeal</p>
                                        <p className="font-medium">{sub.appealerScore}/{sub.maxMarks}</p>
                                      </div>
                                    )}
                                  </div>

                                  {sub.evidence && (
                                    <a href={sub.evidence} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                                      <LinkIcon className="h-4 w-4" />
                                      View Evidence
                                    </a>
                                  )}

                                  {sub.description && (
                                    <div>
                                      <p className="text-muted-foreground mb-1">Description</p>
                                      <p className="text-sm">{sub.description}</p>
                                    </div>
                                  )}

                                 
                                  {(sub.reviewerReason || sub.reviewerScore !== undefined) && (
                                    <div className="border-t pt-4">
                                      <p className="font-medium mb-3 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Review by {sub.reviewerRole?.toUpperCase() || "Reviewer"}
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sub.reviewerScore !== undefined && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Score given</p>
                                            <p className="font-semibold">{sub.reviewerScore} / {sub.maxMarks}</p>
                                          </div>
                                        )}
                                        {sub.reviewerReason && (
                                          <div className="md:col-span-2">
                                            <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                                            <p className="text-sm bg-blue-50/50 p-3 rounded border border-blue-100 whitespace-pre-wrap">
                                              {sub.reviewerReason}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Appeal Section */}
                                  {sub.isAppealed && (
                                    <div className="border-t pt-4 bg-amber-50/30 rounded-lg p-4">
                                      <p className="font-medium mb-3 flex items-center gap-2 text-amber-800">
                                        <Scale className="h-4 w-4" />
                                        Appeal Details ({sub.appealerRole?.toUpperCase() || "Committee"})
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                        {sub.appealRequestedScore !== undefined && (
                                          <div>
                                            <p className="text-muted-foreground">Requested Score</p>
                                            <p className="font-medium">{sub.appealRequestedScore} / {sub.maxMarks}</p>
                                          </div>
                                        )}
                                        {sub.appealerScore !== undefined && (
                                          <div>
                                            <p className="text-muted-foreground">Final Appeal Score</p>
                                            <p className="font-medium text-emerald-700">{sub.appealerScore} / {sub.maxMarks}</p>
                                          </div>
                                        )}
                                        {sub.appealReason && (
                                          <div className="md:col-span-2">
                                            <p className="text-muted-foreground mb-1">Appeal Reason</p>
                                            <p className="bg-amber-50 p-3 rounded border border-amber-200 whitespace-pre-wrap">
                                              {sub.appealReason}
                                            </p>
                                          </div>
                                        )}
                                        {sub.appealerReason && (
                                          <div className="md:col-span-2">
                                            <p className="text-muted-foreground mb-1">Resolution Remarks</p>
                                            <p className="bg-emerald-50 p-3 rounded border border-emerald-200 whitespace-pre-wrap">
                                              {sub.appealerReason}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
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

<Card>
  <CardHeader className="pb-4">
    <CardTitle>Submission History</CardTitle>
    <CardDescription>Your previous task submissions</CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="all">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All Submissions</TabsTrigger>
        <TabsTrigger value="finalized">Finalized</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-2">
        <Accordion type="multiple" className="space-y-3">
          {submissions.map((sub) => (
            <AccordionItem
              key={sub.id}
              value={sub.id}
              className="border rounded-lg overflow-hidden shadow-sm"
            >
              <AccordionTrigger className="px-5 py-4 hover:bg-muted/50 transition-colors no-underline">
                <div className="w-full flex items-center justify-between gap-6">
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-base truncate text-left">{sub.taskName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate text-left">
                      {sub.criteriaName} • {sub.moduleName}
                    </p>
                  </div>

                  
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-primary text-lg">
                        {sub.finalScore ?? sub.claimedScore}/{sub.maxMarks}
                      </p>
                    </div>
                    <Badge
                      variant={statusConfig[sub.status]?.variant || "outline"}
                      className="min-w-[110px] justify-center py-1 text-sm"
                    >
                      {statusConfig[sub.status]?.label || sub.status}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 pt-3 bg-muted/20 border-t">
                <div className="space-y-5 text-sm">
                  
                  {sub.description && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1.5">Description</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{sub.description}</p>
                    </div>
                  )}

                  
                  {sub.evidence && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1.5">Evidence</p>
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <a href={sub.evidence} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          View Evidence
                        </a>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 break-all opacity-80">
                        {sub.evidence}
                      </p>
                    </div>
                  )}

                  
                  {sub.reviewerReason && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1.5">Reviewer Remarks</p>
                      <p className="bg-blue-50/50 p-3 rounded border border-blue-100 whitespace-pre-wrap leading-relaxed">
                        {sub.reviewerReason}
                      </p>
                    </div>
                  )}

                  {sub.appealReason && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1.5">Appeal Reason</p>
                      <p className="bg-amber-50/50 p-3 rounded border border-amber-200 whitespace-pre-wrap leading-relaxed">
                        {sub.appealReason}
                      </p>
                    </div>
                  )}

                  {/* Appeal Resolution */}
                  {sub.appealerReason && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1.5">Appeal Resolution</p>
                      <p className="bg-emerald-50/50 p-3 rounded border border-emerald-100 whitespace-pre-wrap leading-relaxed">
                        {sub.appealerReason}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>

      <TabsContent value="finalized" className="mt-2">
        <Accordion type="multiple" className="space-y-3">
          {submissions.filter(s => ["accepted", "appeal-resolved"].includes(s.status)).map((sub) => (
            <AccordionItem
              key={sub.id}
              value={sub.id}
              className="border rounded-lg overflow-hidden shadow-sm"
            >
              <AccordionTrigger className="px-5 py-4 hover:bg-muted/50 transition-colors no-underline">
                <div className="w-full flex items-center justify-between gap-6">
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-base truncate text-left">{sub.taskName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate text-left">
                      {sub.criteriaName} • {sub.moduleName}
                    </p>
                  </div>

                  
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-primary text-lg">
                        {sub.finalScore ?? sub.claimedScore}/{sub.maxMarks}
                      </p>
                    </div>
                    <Badge variant="success" className="min-w-[110px] justify-center py-1 text-sm">
                      Finalized
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 pt-3 bg-muted/20 border-t">
                <div className="space-y-5 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium mb-1.5">Description</p>
                    <p className="leading-relaxed whitespace-pre-wrap">{sub.description || "No description provided"}</p>
                  </div>

                  {sub.evidence && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1.5">Evidence</p>
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <a href={sub.evidence} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          View Evidence
                        </a>
                      </Button>
                     
                    </div>
                  )}

                  {sub.appealerReason && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1.5">Appeal Resolution</p>
                      <p className="bg-emerald-50/50 p-3 rounded border border-emerald-100 whitespace-pre-wrap leading-relaxed">
                        {sub.appealerReason}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
      </div>
    </DashboardLayout>
  );
}