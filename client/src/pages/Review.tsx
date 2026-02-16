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

interface WorkflowAssignment {
  role?: string;
  roleKey?: string;
  status?: string;
  verifiedScore?: number | null;
  remarks?: string;
}

interface WorkflowQueueItem {
  id: string;
  facultyName?: string;
  facultyEmail?: string;
  facultyId?: string;
  formId?: string;
  criteriaId?: string;
  moduleName?: string;
  taskTitle?: string;
  claimedScore?: number;
  maxMarks?: number;
  evidenceUrl?: string;
  description?: string;
  status?: "submitted" | "appealed" | "approved";
  currentFlow?: "submission" | "appeal";
  assignments?: WorkflowAssignment[];
}

export default function Review() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [queue, setQueue] = useState<WorkflowQueueItem[]>([]);
  const [reviewedItems, setReviewedItems] = useState<WorkflowQueueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({});
  const [reviewInputs, setReviewInputs] = useState<
    Record<string, { verifiedScore: string; remarks: string }>
  >({});
  const [formLookup, setFormLookup] = useState<
    Record<
      string,
      { formTitle: string; criteriaLookup: Record<string, string> }
    >
  >({});

  const canReview = user?.role === "hod" || user?.role === "committee";

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        "/api/committee/workflow/submissions/review-queue",
      );
      const rows: WorkflowQueueItem[] = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setQueue(rows);
      setReviewInputs((prev) => {
        const next = { ...prev };
        rows.forEach((item) => {
          const id = String(item.id || "").trim();
          if (!id || next[id]) return;
          next[id] = {
            verifiedScore:
              item.claimedScore !== undefined &&
              Number.isFinite(Number(item.claimedScore))
                ? String(item.claimedScore)
                : "",
            remarks: "",
          };
        });
        return next;
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch workflow review queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFormLookup = async () => {
    try {
      const res = await api.get("/api/committee/forms");
      const forms = Array.isArray(res.data?.data) ? res.data.data : [];

      const nextLookup: Record<
        string,
        { formTitle: string; criteriaLookup: Record<string, string> }
      > = {};

      forms.forEach((formItem: any) => {
        const currentFormId = String(formItem?.id || "").trim();
        if (!currentFormId) return;

        const criteriaList = Array.isArray(formItem?.criteria)
          ? formItem.criteria
          : [];

        const criteriaLookup: Record<string, string> = {};
        criteriaList.forEach((criteriaItem: any) => {
          const currentCriteriaId = String(criteriaItem?.id || "").trim();
          if (!currentCriteriaId) return;
          criteriaLookup[currentCriteriaId] = String(
            criteriaItem?.criteriaName || currentCriteriaId,
          ).trim();
        });

        nextLookup[currentFormId] = {
          formTitle: String(formItem?.formTitle || currentFormId).trim(),
          criteriaLookup,
        };
      });

      setFormLookup(nextLookup);
    } catch {
      // keep id fallback in UI
    }
  };

  useEffect(() => {
    if (!user || !canReview) {
      setLoading(false);
      return;
    }

    fetchQueue();
    fetchFormLookup();
  }, [user?.id, user?.role]);

  if (!user) return null;

  if (!canReview) {
    return (
      <DashboardLayout title="Review Submissions">
        <div className="text-center text-muted-foreground py-16">
          Access restricted to HOD and Committee roles.
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

  const filteredQueue = queue.filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      String(item.facultyName || "")
        .toLowerCase()
        .includes(query) ||
      String(item.facultyEmail || "")
        .toLowerCase()
        .includes(query) ||
      String(item.taskTitle || "")
        .toLowerCase()
        .includes(query) ||
      String(item.moduleName || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const filteredReviewed = reviewedItems.filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      String(item.facultyName || "")
        .toLowerCase()
        .includes(query) ||
      String(item.facultyEmail || "")
        .toLowerCase()
        .includes(query) ||
      String(item.taskTitle || "")
        .toLowerCase()
        .includes(query) ||
      String(item.moduleName || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const pendingAppeals = queue.filter(
    (item) => String(item.status || "") === "appealed",
  ).length;

  const resolveFormTitle = (formId?: string) => {
    const resolvedFormId = String(formId || "").trim();
    if (!resolvedFormId) return "-";
    return formLookup[resolvedFormId]?.formTitle || resolvedFormId;
  };

  const resolveCriteriaName = (formId?: string, criteriaId?: string) => {
    const resolvedFormId = String(formId || "").trim();
    const resolvedCriteriaId = String(criteriaId || "").trim();
    if (!resolvedCriteriaId) return "-";

    return (
      formLookup[resolvedFormId]?.criteriaLookup?.[resolvedCriteriaId] ||
      resolvedCriteriaId
    );
  };

  const updateReviewInput = (
    submissionId: string,
    field: "verifiedScore" | "remarks",
    value: string,
    maxMarks?: number,
  ) => {
    const clampScoreInput = () => {
      if (field !== "verifiedScore") return value;

      const trimmedValue = String(value || "").trim();
      if (trimmedValue === "") return "";

      const parsed = Number(trimmedValue);
      const max = Number(maxMarks || 0);
      if (!Number.isFinite(parsed)) return "";

      const bounded = Math.max(0, Math.min(parsed, max));
      return String(bounded);
    };

    setReviewInputs((prev) => ({
      ...prev,
      [submissionId]: {
        verifiedScore: prev[submissionId]?.verifiedScore || "",
        remarks: prev[submissionId]?.remarks || "",
        [field]: clampScoreInput(),
      },
    }));
  };

  const handleReview = async (item: WorkflowQueueItem) => {
    const submissionId = String(item.id || "").trim();
    if (!submissionId) return;

    const input = reviewInputs[submissionId] || {
      verifiedScore: "",
      remarks: "",
    };

    const numericScore = Number(input.verifiedScore);
    const maxMarks = Number(item.maxMarks || 0);

    if (
      !Number.isFinite(numericScore) ||
      numericScore < 0 ||
      numericScore > maxMarks
    ) {
      toast({
        title: "Invalid score",
        description: `Score must be between 0 and ${maxMarks}.`,
        variant: "destructive",
      });
      return;
    }

    setReviewing((prev) => ({ ...prev, [submissionId]: true }));
    try {
      await api.post(
        `/api/committee/workflow/submissions/${submissionId}/review`,
        {
          verifiedScore: numericScore,
          remarks: input.remarks,
        },
      );

      setQueue((prev) => prev.filter((row) => row.id !== submissionId));
      setReviewedItems((prev) => [item, ...prev]);

      toast({
        title: "Reviewed successfully",
        description: "Submission moved to next workflow stage.",
      });
    } catch (error: any) {
      toast({
        title: "Review failed",
        description:
          error?.response?.data?.message || "Unable to review submission.",
        variant: "destructive",
      });
    } finally {
      setReviewing((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const renderQueueCard = (
    item: WorkflowQueueItem,
    type: "pending" | "reviewed",
  ) => {
    const submissionId = String(item.id || "").trim();
    const input = reviewInputs[submissionId] || {
      verifiedScore: "",
      remarks: "",
    };
    const isReviewing = Boolean(reviewing[submissionId]);
    const maxMarks = Number(item.maxMarks || 0);
    const status = String(item.status || "submitted").toLowerCase();
    const flow = String(item.currentFlow || "submission").toLowerCase();

    return (
      <Card key={submissionId} className="border shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {item.taskTitle || "Task"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {item.moduleName || "Module"} •{" "}
                {item.facultyName || item.facultyEmail || "Faculty"}
              </p>
              <p className="text-xs text-muted-foreground">
                Form: {resolveFormTitle(item.formId)} • Criteria:{" "}
                {resolveCriteriaName(item.formId, item.criteriaId)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={status === "appealed" ? "destructive" : "secondary"}
              >
                {status || "submitted"}
              </Badge>
              <Badge variant="outline">Flow: {flow}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3 text-sm">
              <p>
                <strong>Claimed:</strong> {Number(item.claimedScore || 0)} /{" "}
                {maxMarks}
              </p>
              <p className="mt-1 break-all">
                <strong>Evidence:</strong> {item.evidenceUrl || "-"}
              </p>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Faculty Description</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {item.description || "-"}
              </p>
            </div>
          </div>

          {type === "pending" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Verified Score
                </label>
                <Input
                  type="number"
                  min={0}
                  max={maxMarks}
                  value={input.verifiedScore}
                  onChange={(e) =>
                    updateReviewInput(
                      submissionId,
                      "verifiedScore",
                      e.target.value,
                      maxMarks,
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Remarks
                </label>
                <Textarea
                  value={input.remarks}
                  onChange={(e) =>
                    updateReviewInput(submissionId, "remarks", e.target.value)
                  }
                  placeholder="Enter review remarks"
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          {Array.isArray(item.assignments) && item.assignments.length > 0 ? (
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium mb-2">Assignments</p>
              <div className="flex flex-wrap gap-2">
                {item.assignments.map((assignment, index) => (
                  <Badge
                    key={`${submissionId}-assignment-${index}`}
                    variant="outline"
                  >
                    {String(assignment.role || assignment.roleKey || "Role")} •{" "}
                    {String(assignment.status || "pending")}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {type === "pending" ? (
            <div className="flex justify-end">
              <Button onClick={() => handleReview(item)} disabled={isReviewing}>
                {isReviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isReviewing ? "Reviewing..." : "Submit Review"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Badge className="bg-emerald-600 text-white">Reviewed</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout
      title="Review Submissions"
      subtitle="Faculty Submissions Review"
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display">
              {queue.length + reviewedItems.length}
            </p>
            <p className="text-xs text-muted-foreground">workflow items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-destructive">
              {queue.length}
            </p>
            <p className="text-xs text-muted-foreground">
              pending review items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-success">
              {pendingAppeals}
            </p>
            <p className="text-xs text-muted-foreground">appeal flow items</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Box */}
      <div className="mb-6 w-full md:w-full">
        <Input
          placeholder="Search by faculty, module, task or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Pending Review */}
      <h2 className="text-lg font-semibold mb-4">Pending Review</h2>
      <div className="space-y-6 mb-12">
        {filteredQueue.length === 0 && (
          <p className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">
            No workflow submissions available for review.
          </p>
        )}
        {filteredQueue.map((item) => renderQueueCard(item, "pending"))}
      </div>

      {/* Verified Submissions */}
      <h2 className="text-lg font-semibold mb-4">Verified Submissions</h2>
      <div className="space-y-6">
        {filteredReviewed.map((item) => renderQueueCard(item, "reviewed"))}
        {filteredReviewed.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No reviewed submissions in this session.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
