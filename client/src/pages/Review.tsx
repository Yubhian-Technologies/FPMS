
import { useState, useEffect } from "react";
import { api } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileText, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SubmissionItem {
  id: string;
  formId: string | null;
  formTitle: string | null;
  criteriaId: string | null;
  criteriaName: string | null;
  taskId: string | null;
  taskName: string | null;
  moduleId: string | null;
  moduleName: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  college: string | null;
  department: string | null;
  claimedScore: number | null;
  evidence: string | null;
  description: string | null;
  maxMarks: number | null;
  reviewerScore: number | null;
  reviewerReason: string | null;
  reviewerId: string | null;
  reviewerRole: string | null;
  isAppealed: boolean;
  appealReason: string | null;
  appealRequestedScore: number | null;
  appealerScore: number | null;
  appealerReason: string | null;
  appealerId: string | null;
  appealerRole: string | null;
  status: string;
  finalScore: number | null;
  submitToRoleIds: string[];
  appealToRoleIds: string[];
  createdAt: any;
  updatedAt: any;
}

export default function Review() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [queue, setQueue] = useState<SubmissionItem[]>([]);
  const [reviewedItems, setReviewedItems] = useState<SubmissionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({});
  const [reviewInputs, setReviewInputs] = useState<
    Record<string, { verifiedScore: string; remarks: string }>
  >({});
  const [selectedFacultyEmail, setSelectedFacultyEmail] = useState<string | null>(null);

  const isHOD = (user?.role || "").toLowerCase() === "hod";
  const canReview = user?.role && user.role !== "faculty";

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [pendingRes, reviewedRes] = await Promise.all([
        api.get("/api/submissions/review-queue"),
        api.get("/api/submissions/my-reviewed"),
      ]);

      const pending = Array.isArray(pendingRes.data?.data) ? pendingRes.data.data : [];
      const reviewed = Array.isArray(reviewedRes.data?.data) ? reviewedRes.data.data : [];

      setQueue(pending);
      setReviewedItems(reviewed);

      setReviewInputs((prev) => {
        const next = { ...prev };
        [...pending, ...reviewed].forEach((item) => {
          const id = String(item.id || "").trim();
          if (!id || next[id]) return;
          next[id] = {
            verifiedScore:
              item.claimedScore !== null && Number.isFinite(Number(item.claimedScore))
                ? String(item.claimedScore)
                : "",
            remarks: "",
          };
        });
        return next;
      });
    } catch (error) {
      console.error("Failed to fetch review queue:", error);
      toast({
        title: "Error",
        description: "Failed to fetch review queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canReview) {
      setLoading(false);
      return;
    }
    fetchQueue();
  }, [user?.id, user?.role]);

  if (!user) return null;
  if (!canReview) {
    return (
      <DashboardLayout title="Review Submissions">
        <div className="text-center text-muted-foreground py-16">
          Access restricted to reviewer roles.
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Review Submissions">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const displayUser = (item: SubmissionItem) =>
    isHOD ? item.userName || item.userEmail || "—" : "Faculty Member";

  // ─── Faculty grouping & status ────────────────────────────────────────
  const facultyMap = isHOD
    ? [...queue, ...reviewedItems].reduce((acc, item) => {
        const key = item.userEmail || "unknown";
        if (!acc[key]) {
          acc[key] = {
            name: item.userName || key.split("@")[0] || "Unknown",
            items: [],
          };
        }
        acc[key].items.push(item);
        return acc;
      }, {} as Record<string, { name: string; items: SubmissionItem[] }>)
    : {};

  const getFacultyStatus = (items: SubmissionItem[]) => {
    const total = items.length;
    const reviewedCount = items.filter((i) => i.reviewerScore != null).length;
    const pendingCount = total - reviewedCount;

    if (pendingCount === 0)
      return { label: "Completed", variant: "success", bg: "bg-green-100 text-green-800 border-green-300" };
    if (reviewedCount === 0)
      return { label: "Pending", variant: "destructive", bg: "bg-red-100 text-red-800 border-red-300" };
    return { label: "!Not Completed", variant: "default", bg: "bg-amber-100 text-amber-800 border-amber-300" };
  };

  const facultyList = Object.entries(facultyMap)
    .filter(([key]) => key !== "unknown")
    .map(([email, data]) => {
      const status = getFacultyStatus(data.items);
      return {
        email,
        name: data.name,
        total: data.items.length,
        pending: data.items.filter((i) => i.reviewerScore == null).length,
        status,
      };
    })
    .sort((a, b) => (a.status.label === "Completed" ? 1 : b.status.label === "Completed" ? -1 : 0));

  const selectedFaculty = selectedFacultyEmail ? facultyMap[selectedFacultyEmail] : null;
  const selectedItems = selectedFaculty?.items || [];

  const criteriaGroups = selectedItems.reduce((acc, item) => {
    const criteria = item.criteriaName?.trim() || "Unspecified Criteria";
    if (!acc[criteria]) acc[criteria] = { pending: [], reviewed: [] };
    if (item.reviewerScore == null) {
      acc[criteria].pending.push(item);
    } else {
      acc[criteria].reviewed.push(item);
    }
    return acc;
  }, {} as Record<string, { pending: SubmissionItem[]; reviewed: SubmissionItem[] }>);

  const resolveFormTitle = (formTitle?: string | null) => String(formTitle || "").trim() || "—";
  const resolveCriteriaName = (criteriaName?: string | null) => String(criteriaName || "").trim() || "—";

  const updateReviewInput = (
    submissionId: string,
    field: "verifiedScore" | "remarks",
    value: string,
    maxMarks?: number,
  ) => {
    const clamp = () => {
      if (field !== "verifiedScore") return value;
      const trimmed = value.trim();
      if (!trimmed) return "";
      const num = Number(trimmed);
      const max = Number(maxMarks || 0);
      if (!Number.isFinite(num)) return "";
      return String(Math.max(0, Math.min(num, max)));
    };

    setReviewInputs((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: clamp(),
      },
    }));
  };

  const handleReview = async (item: SubmissionItem) => {
    const id = String(item.id || "").trim();
    if (!id) return;

    const input = reviewInputs[id] || { verifiedScore: "", remarks: "" };
    const score = Number(input.verifiedScore);
    const max = Number(item.maxMarks || 0);

    if (!Number.isFinite(score) || score < 0 || score > max) {
      toast({
        title: "Invalid score",
        description: `Score must be between 0 and ${max}.`,
        variant: "destructive",
      });
      return;
    }

    setReviewing((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/api/submissions/${id}/review`, {
        reviewerScore: score,
        reviewerReason: input.remarks,
      });

      const updated: SubmissionItem = {
        ...item,
        reviewerScore: score,
        reviewerReason: input.remarks,
        status: "reviewed",
        finalScore: score,
      };

      setQueue((prev) => prev.filter((r) => r.id !== id));
      setReviewedItems((prev) => [updated, ...prev]);

      toast({
        title: "Success",
        description: "Review submitted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Review failed",
        description: err?.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setReviewing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const renderSubmissionCard = (item: SubmissionItem, type: "pending" | "reviewed") => {
    const id = String(item.id || "").trim();
    const input = reviewInputs[id] || { verifiedScore: "", remarks: "" };
    const isReviewing = !!reviewing[id];
    const max = Number(item.maxMarks || 0);
    const statusLower = (item.status || "submitted").toLowerCase();
    const isAppeal = item.isAppealed && item.appealToRoleIds?.length > 0;

    return (
      <Card key={id} className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base">{item.taskName || "Task"}</CardTitle>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{item.moduleName || "—"} • {displayUser(item)}</div>
                <div>
                  Form: {resolveFormTitle(item.formTitle)} • {resolveCriteriaName(item.criteriaName)}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={
                  statusLower === "appealed"
                    ? "destructive"
                    : statusLower === "reviewed"
                    ? "default"
                    : "secondary"
                }
              >
                {statusLower}
              </Badge>
              {isAppeal && <Badge variant="outline">Appeal</Badge>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-1">
          <div className="flex justify-between items-center text-sm bg-muted/50 rounded px-3 py-2.5">
            <div>
              <span className="font-medium">Claimed:</span> {item.claimedScore ?? 0} / {max}
            </div>
            {item.reviewerScore != null && (
              <div className="font-medium">
                Awarded:{" "}
                <span className={item.reviewerScore === item.claimedScore ? "text-green-600" : "text-amber-600"}>
                  {item.reviewerScore}
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <div className="font-medium mb-1">Evidence</div>
              <p className="text-muted-foreground line-clamp-3 break-words">
                {item.evidence || "—"}
              </p>
            </div>
            <div>
              <div className="font-medium mb-1">Description</div>
              <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">
                {item.description || "—"}
              </p>
            </div>
          </div>

          {item.isAppealed && item.appealReason && (
            <div className="border border-amber-200 bg-amber-50/70 rounded p-3 text-sm">
              <div className="font-medium text-amber-900 mb-1.5">Appeal Request</div>
              <p className="text-amber-800">{item.appealReason}</p>
              {item.appealRequestedScore != null && (
                <p className="mt-2 text-amber-800">
                  Requested: <strong>{item.appealRequestedScore}</strong>
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Verified Score</label>
              <Input
                type="number"
                min={0}
                max={max}
                value={type === "pending" ? input.verifiedScore : (item.reviewerScore ?? "")}
                onChange={(e) => type === "pending" && updateReviewInput(id, "verifiedScore", e.target.value, max)}
                disabled={type === "reviewed" || isReviewing}
                className={type === "reviewed" ? "bg-muted" : ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Remarks</label>
              <Textarea
                value={type === "pending" ? input.remarks : (item.reviewerReason ?? "")}
                onChange={(e) => type === "pending" && updateReviewInput(id, "remarks", e.target.value)}
                placeholder="Optional remarks..."
                rows={2}
                disabled={type === "reviewed" || isReviewing}
                className={`min-h-[80px] ${type === "reviewed" ? "bg-muted" : ""}`}
              />
            </div>
          </div>

          {type === "pending" ? (
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => handleReview(item)} disabled={isReviewing}>
                {isReviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isReviewing ? "Saving..." : "Submit Review"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Reviewed
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout title="Review Submissions" subtitle="Faculty Performance Review">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{queue.length + reviewedItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{queue.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviewed</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{reviewedItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {isHOD ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Faculty Overview</h2>
            <div className="text-sm text-muted-foreground">{facultyList.length} faculty</div>
          </div>

          {facultyList.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30 text-muted-foreground">
              No faculty submissions available
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {facultyList.map((f) => (
                <Card
                  key={f.email}
                  className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                    f.status.label === "Completed" ? "opacity-75" : ""
                  }`}
                  onClick={() => setSelectedFacultyEmail(f.email)}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="font-semibold">{f.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{f.email}</div>
                      </div>
                      <Badge className={`px-3 py-1 ${f.status.bg}`}>{f.status.label}</Badge>
                    </div>
                    <div className="mt-4 flex justify-between text-sm">
                      <div>
                        Total: <strong>{f.total}</strong>
                      </div>
                      <div className={f.pending > 0 ? "text-destructive font-medium" : ""}>
                        Pending: <strong>{f.pending}</strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <h6 className="text-lg font-bold mb-5">Pending Review</h6>
          {queue.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30 text-muted-foreground mb-12">
              No pending submissions
            </div>
          ) : (
            <div className="space-y-6 mb-12">{queue.map((item) => renderSubmissionCard(item, "pending"))}</div>
          )}

          <h2 className="text-lg font-semibold mb-4">My Reviewed Submissions</h2>
          {reviewedItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30 text-muted-foreground">
              No submissions reviewed yet
            </div>
          ) : (
            <div className="space-y-6">{reviewedItems.map((item) => renderSubmissionCard(item, "reviewed"))}</div>
          )}
        </>
      )}

      {/* Faculty Detail Dialog */}
      <Dialog open={!!selectedFacultyEmail} onOpenChange={() => setSelectedFacultyEmail(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-5 border-b">
            <DialogTitle className="text-2xl">{selectedFaculty?.name || "Faculty"} Submissions</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              {selectedItems.length} items • {selectedItems.filter((i) => i.reviewerScore == null).length} still pending
            </p>
          </DialogHeader>

          {Object.keys(criteriaGroups).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No submissions found</div>
          ) : (
            <Accordion
              type="single"
              collapsible
              defaultValue={Object.keys(criteriaGroups)[0]}
              className="space-y-4 mt-6"
            >
              {Object.entries(criteriaGroups).map(([criteria, { pending, reviewed }]) => (
                <AccordionItem key={criteria} value={criteria} className="border rounded-lg">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="text-lg font-semibold">{criteria}</span>
                      <div className="flex gap-6 text-sm font-medium">
                        <span>
                          Pending:{" "}
                          <strong className={pending.length > 0 ? "text-destructive" : ""}>{pending.length}</strong>
                        </span>
                        <span>Reviewed: {reviewed.length}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-6 pt-5 space-y-10">
                    {pending.length > 0 && (
                      <div>
                        <h4 className="text-base font-medium mb-5 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                          Pending Review ({pending.length})
                        </h4>
                        <div className="space-y-6">{pending.map((item) => renderSubmissionCard(item, "pending"))}</div>
                      </div>
                    )}

                    {reviewed.length > 0 && (
                      <div>
                        <h4 className="text-base font-medium mb-5 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                          Reviewed ({reviewed.length})
                        </h4>
                        <div className="space-y-6">{reviewed.map((item) => renderSubmissionCard(item, "reviewed"))}</div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}