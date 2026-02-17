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

export default function AppealReview() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [queue, setQueue] = useState<SubmissionItem[]>([]);
  const [resolvedItems, setResolvedItems] = useState<SubmissionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({});
  const [reviewInputs, setReviewInputs] = useState<
    Record<string, { appealerScore: string; appealerReason: string }>
  >({});

  // Can review appeals if user is dean, vice-principal, principal, or committee
  const canReviewAppeal =
    user?.role === "dean" ||
    user?.role === "principle" ||
    user?.role === "committee" ||
    String(user?.role || "")
      .toLowerCase()
      .includes("vice");

  const fetchQueue = async () => {
    setLoading(true);
    try {
      console.log(
        "[AppealReview] Fetching appeal queue and resolved appeals...",
      );
      console.log("[AppealReview] User role:", user?.role);

      // Fetch both pending appeals and resolved appeals
      const [pendingRes, resolvedRes] = await Promise.all([
        api.get("/api/submissions/appeal-queue"),
        api.get("/api/submissions/my-resolved-appeals"),
      ]);

      const pending: SubmissionItem[] = Array.isArray(pendingRes.data?.data)
        ? pendingRes.data.data
        : [];

      const resolved: SubmissionItem[] = Array.isArray(resolvedRes.data?.data)
        ? resolvedRes.data.data
        : [];

      console.log(
        "[AppealReview] Fetched appeal queue:",
        pending.length,
        "items",
      );
      console.log(
        "[AppealReview] Fetched resolved appeals:",
        resolved.length,
        "items",
      );
      if (pending.length > 0) {
        console.log("[AppealReview] First pending appeal:", pending[0]);
      }

      setQueue(pending);
      setResolvedItems(resolved);
      setReviewInputs((prev) => {
        const next = { ...prev };
        pending.forEach((item) => {
          const id = String(item.id || "").trim();
          if (!id || next[id]) return;
          // Initialize with requested score or reviewer score
          const defaultScore =
            item.appealRequestedScore ??
            item.reviewerScore ??
            item.claimedScore;
          next[id] = {
            appealerScore:
              defaultScore !== null && Number.isFinite(Number(defaultScore))
                ? String(defaultScore)
                : "",
            appealerReason: "",
          };
        });
        return next;
      });
    } catch (error) {
      console.error("[AppealReview] Failed to fetch appeal queue:", error);
      toast({
        title: "Error",
        description: "Failed to fetch appeal queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canReviewAppeal) {
      setLoading(false);
      return;
    }

    fetchQueue();
  }, [user?.id, user?.role]);

  if (!user) return null;

  if (!canReviewAppeal) {
    return (
      <DashboardLayout title="Review Appeals">
        <div className="text-center text-muted-foreground py-16">
          Access restricted to Dean, Vice Principal, and Committee roles.
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Review Appeals">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const filteredQueue = queue.filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      String(item.userName || "")
        .toLowerCase()
        .includes(query) ||
      String(item.userEmail || "")
        .toLowerCase()
        .includes(query) ||
      String(item.taskName || "")
        .toLowerCase()
        .includes(query) ||
      String(item.moduleName || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const filteredResolved = resolvedItems.filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      String(item.userName || "")
        .toLowerCase()
        .includes(query) ||
      String(item.userEmail || "")
        .toLowerCase()
        .includes(query) ||
      String(item.taskName || "")
        .toLowerCase()
        .includes(query) ||
      String(item.moduleName || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const resolveFormTitle = (formTitle?: string | null) => {
    return String(formTitle || "").trim() || "-";
  };

  const resolveCriteriaName = (criteriaName?: string | null) => {
    return String(criteriaName || "").trim() || "-";
  };

  const updateAppealInput = (
    submissionId: string,
    field: "appealerScore" | "appealerReason",
    value: string,
    maxMarks?: number,
  ) => {
    const clampScoreInput = () => {
      if (field !== "appealerScore") return value;

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
        appealerScore: prev[submissionId]?.appealerScore || "",
        appealerReason: prev[submissionId]?.appealerReason || "",
        [field]: clampScoreInput(),
      },
    }));
  };

  const handleAppealReview = async (item: SubmissionItem) => {
    const submissionId = String(item.id || "").trim();
    if (!submissionId) return;

    const input = reviewInputs[submissionId] || {
      appealerScore: "",
      appealerReason: "",
    };

    const numericScore = Number(input.appealerScore);
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
      await api.post(`/api/submissions/${submissionId}/review-appeal`, {
        appealerScore: numericScore,
        appealerReason: input.appealerReason,
      });

      // Update the item with appeal review data before moving to resolved
      const resolvedItem: SubmissionItem = {
        ...item,
        appealerScore: numericScore,
        appealerReason: input.appealerReason,
        status: "appeal-resolved",
        finalScore: numericScore,
      };

      setQueue((prev) => prev.filter((row) => row.id !== submissionId));
      setResolvedItems((prev) => [resolvedItem, ...prev]);

      toast({
        title: "Appeal reviewed successfully",
        description: "Appeal has been resolved.",
      });
    } catch (error: any) {
      toast({
        title: "Appeal review failed",
        description:
          error?.response?.data?.message || "Unable to review appeal.",
        variant: "destructive",
      });
    } finally {
      setReviewing((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const renderAppealCard = (
    item: SubmissionItem,
    type: "pending" | "resolved",
  ) => {
    const submissionId = String(item.id || "").trim();
    const input = reviewInputs[submissionId] || {
      appealerScore: "",
      appealerReason: "",
    };
    const isReviewing = Boolean(reviewing[submissionId]);
    const maxMarks = Number(item.maxMarks || 0);
    const status = String(item.status || "appealed").toLowerCase();

    return (
      <Card key={submissionId} className="border shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {item.taskName || "Task"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {item.moduleName || "Module"} •{" "}
                {item.userName || item.userEmail || "Faculty"}
              </p>
              <p className="text-xs text-muted-foreground">
                Form: {resolveFormTitle(item.formTitle)} • Criteria:{" "}
                {resolveCriteriaName(item.criteriaName)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={
                  status === "appealed"
                    ? "destructive"
                    : status === "appeal-resolved"
                      ? "default"
                      : "secondary"
                }
              >
                {status || "appealed"}
              </Badge>
              {item.appealToRoleIds.length > 0 && (
                <Badge variant="outline">
                  Appeal To: {item.appealToRoleIds.join(", ")}
                </Badge>
              )}
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
              <p className="mt-1">
                <strong>Reviewer Score:</strong>{" "}
                {item.reviewerScore !== null ? item.reviewerScore : "-"}
              </p>
              <p className="mt-1 break-all">
                <strong>Evidence:</strong> {item.evidence || "-"}
              </p>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {item.description || "-"}
              </p>
            </div>
          </div>

          {/* Review Details Section */}
          {item.reviewerScore !== null && item.reviewerReason && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium mb-2 text-blue-900">
                Reviewer's Evaluation
              </p>
              <p className="text-sm text-blue-800">
                <strong>Verified Score:</strong> {item.reviewerScore} /{" "}
                {maxMarks}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Remarks:</strong> {item.reviewerReason}
              </p>
            </div>
          )}

          {/* Appeal Information Section */}
          {item.isAppealed && item.appealReason && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium mb-2 text-amber-900">
                Appeal Information
              </p>
              <p className="text-sm text-amber-800">
                <strong>Reason:</strong> {item.appealReason}
              </p>
              {item.appealRequestedScore !== null && (
                <p className="text-sm text-amber-800 mt-1">
                  <strong>Requested Score:</strong> {item.appealRequestedScore}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Final Score
              </label>
              <Input
                type="number"
                min={0}
                max={maxMarks}
                value={
                  type === "pending"
                    ? input.appealerScore
                    : (item.appealerScore ?? "")
                }
                onChange={(e) =>
                  updateAppealInput(
                    submissionId,
                    "appealerScore",
                    e.target.value,
                    maxMarks,
                  )
                }
                disabled={type === "resolved"}
                className={type === "resolved" ? "bg-muted" : ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <Textarea
                value={
                  type === "pending"
                    ? input.appealerReason
                    : (item.appealerReason ?? "")
                }
                onChange={(e) =>
                  updateAppealInput(
                    submissionId,
                    "appealerReason",
                    e.target.value,
                  )
                }
                placeholder="Enter appeal review remarks"
                rows={3}
                disabled={type === "resolved"}
                className={type === "resolved" ? "bg-muted" : ""}
              />
            </div>
          </div>

          {type === "resolved" && (
            <div className="text-sm text-purple-600 font-medium">
              ✓ Appeal resolved
            </div>
          )}

          {type === "pending" ? (
            <div className="flex justify-end">
              <Button
                onClick={() => handleAppealReview(item)}
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isReviewing ? "Reviewing..." : "Submit Appeal Review"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Badge className="bg-purple-600 text-white">
                Appeal Resolved
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout
      title="Review Appeals"
      subtitle="Faculty Appeal Submissions Review"
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Appeals
            </CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display">
              {queue.length + resolvedItems.length}
            </p>
            <p className="text-xs text-muted-foreground">appeal items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Appeals
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-destructive">
              {queue.length}
            </p>
            <p className="text-xs text-muted-foreground">
              pending appeal reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-success">
              {resolvedItems.length}
            </p>
            <p className="text-xs text-muted-foreground">resolved by you</p>
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

      {/* Pending Appeals */}
      <h2 className="text-lg font-semibold mb-4">Pending Appeals</h2>
      <div className="space-y-6 mb-12">
        {filteredQueue.length === 0 && (
          <p className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">
            No appeals available for review.
          </p>
        )}
        {filteredQueue.map((item) => renderAppealCard(item, "pending"))}
      </div>

      {/* Resolved Appeals */}
      <h2 className="text-lg font-semibold mb-4">My Resolved Appeals</h2>
      <div className="space-y-6">
        {filteredResolved.map((item) => renderAppealCard(item, "resolved"))}
        {filteredResolved.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No appeals have been resolved by you yet.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
