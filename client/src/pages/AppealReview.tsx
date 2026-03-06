
import { useState, useEffect } from "react";
import { api } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

  const [openCollege, setOpenCollege] = useState<string | null>(null);
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [openFaculty, setOpenFaculty] = useState<string | null>(null);

  const canReviewAppeal =
    user?.role === "dean" ||
    user?.role === "principle" ||
    user?.role === "committee" ||
    String(user?.role || "").toLowerCase().includes("vice");

  const isCommittee = user?.role === "committee";

  const fetchQueue = async () => {
    setLoading(true);
    try {
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

      setQueue(pending);
      setResolvedItems(resolved);

      setReviewInputs((prev) => {
        const next = { ...prev };
        pending.forEach((item) => {
          const id = String(item.id || "").trim();
          if (!id || next[id]) return;
          const defaultScore =
            item.appealRequestedScore ?? item.reviewerScore ?? item.claimedScore;
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
      console.error("Failed to fetch appeal queue:", error);
      toast({
        title: "Error",
        description: "Failed to load appeal queue",
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
        <div className="text-left text-muted-foreground py-16 pl-6">
          Access restricted to authorized roles (Dean, Principal, Committee, Vice Principal, etc.)
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Review Appeals">
        <div className="flex justify-start items-center h-64 pl-6">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Data preparation ────────────────────────────────────────
  const facultyMap = [...queue, ...resolvedItems].reduce((acc, item) => {
    const email = (item.userEmail || "unknown").trim().toLowerCase();
    if (email === "unknown") return acc;

    if (!acc[email]) {
      acc[email] = {
        name: item.userName || email.split("@")[0] || "Unknown",
        role: (item.userRole || "Unknown").trim(),
        college: (item.college || "Unknown").trim(),
        items: [],
      };
    }
    acc[email].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; role: string; college: string; items: SubmissionItem[] }>);

  let facultyList = Object.entries(facultyMap)
    .filter(([email]) => email !== "unknown")
    .map(([email, data]) => ({
      email,
      name: data.name,
      role: data.role,
      college: data.college,
      total: data.items.length,
      pending: data.items.filter((i) => i.appealerScore === null).length,
    }));

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    facultyList = facultyList.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.email.toLowerCase().includes(term) ||
        f.role.toLowerCase().includes(term) ||
        f.college.toLowerCase().includes(term)
    );
  }

  const collegeList = isCommittee
    ? Array.from(new Set(facultyList.map((f) => f.college)))
        .filter(Boolean)
        .map((college) => {
          const inCollege = facultyList.filter((f) => f.college === college);
          return {
            college,
            total: inCollege.reduce((sum, f) => sum + f.total, 0),
            pending: inCollege.reduce((sum, f) => sum + f.pending, 0),
          };
        })
    : [];

  const getRolesForCollege = (collegeName: string) =>
    Array.from(
      new Set(
        facultyList
          .filter((f) => f.college === collegeName)
          .map((f) => f.role)
      )
    )
      .filter(Boolean)
      .map((role) => {
        const inRole = facultyList.filter(
          (f) => f.college === collegeName && f.role === role
        );
        return {
          role,
          total: inRole.reduce((sum, f) => sum + f.total, 0),
          pending: inRole.reduce((sum, f) => sum + f.pending, 0),
        };
      });

  const getFacultyForRole = (collegeName: string, roleName: string) =>
    facultyList.filter((f) => f.college === collegeName && f.role === roleName);

  const selectedFaculty = openFaculty ? facultyMap[openFaculty.toLowerCase()] : null;
  const selectedFacultyItems = selectedFaculty?.items || [];

  const criteriaGroups = selectedFacultyItems.reduce((acc, item) => {
    const crit = item.criteriaName?.trim() || "Unspecified Criteria";
    if (!acc[crit]) acc[crit] = { pending: [], resolved: [] };
    if (item.appealerScore === null) {
      acc[crit].pending.push(item);
    } else {
      acc[crit].resolved.push(item);
    }
    return acc;
  }, {} as Record<string, { pending: SubmissionItem[]; resolved: SubmissionItem[] }>);

  const resolve = (v?: string | null) => String(v || "").trim() || "—";

  const updateAppealInput = (
    submissionId: string,
    field: "appealerScore" | "appealerReason",
    value: string,
    maxMarks?: number,
  ) => {
    const clamped = field === "appealerScore"
      ? (() => {
          const trimmed = value.trim();
          if (!trimmed) return "";
          const num = Number(trimmed);
          const max = Number(maxMarks || 0);
          if (!Number.isFinite(num)) return "";
          return String(Math.max(0, Math.min(num, max)));
        })()
      : value;

    setReviewInputs((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: clamped,
      },
    }));
  };

  const handleAppealReview = async (item: SubmissionItem) => {
    const submissionId = String(item.id || "").trim();
    if (!submissionId) return;

    const input = reviewInputs[submissionId] || { appealerScore: "", appealerReason: "" };
    const numericScore = Number(input.appealerScore);
    const maxMarks = Number(item.maxMarks || 0);

    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > maxMarks) {
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
        appealerReason: input.appealerReason.trim(),
      });

      const resolvedItem: SubmissionItem = {
        ...item,
        appealerScore: numericScore,
        appealerReason: input.appealerReason.trim(),
        status: "appeal-resolved",
        finalScore: numericScore,
      };

      setQueue((prev) => prev.filter((row) => row.id !== submissionId));
      setResolvedItems((prev) => [resolvedItem, ...prev]);

      toast({
        title: "Success",
        description: "Appeal reviewed and resolved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error?.response?.data?.message || "Could not process appeal review.",
        variant: "destructive",
      });
    } finally {
      setReviewing((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const renderAppealCard = (item: SubmissionItem, type: "pending" | "resolved") => {
    const id = String(item.id || "").trim();
    const input = reviewInputs[id] || { appealerScore: "", appealerReason: "" };
    const isReviewing = !!reviewing[id];
    const max = Number(item.maxMarks || 0);
    const status = (item.status || "appealed").toLowerCase();

    return (
      <Card key={id} className="border shadow-md rounded-lg overflow-hidden">
        <CardHeader className="bg-slate-50 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {item.taskName || "Task"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {item.moduleName || "Module"} • {item.userName || item.userEmail}
              </p>
              <p className="text-sm text-muted-foreground">
                Form: {resolve(item.formTitle)} • {resolve(item.criteriaName)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={
                  status === "appealed" ? "destructive" :
                  status === "appeal-resolved" ? "default" : "secondary"
                }
              >
                {status}
              </Badge>
              {!!item.appealToRoleIds?.length && (
                <Badge variant="outline" className="text-xs">
                  To: {item.appealToRoleIds.join(", ")}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-md p-4 bg-white shadow-sm">
              <p className="font-medium mb-1">Claimed</p>
              <p>{Number(item.claimedScore || 0)} / {max}</p>
              <p className="mt-2 font-medium">Reviewer Score</p>
              <p>{item.reviewerScore ?? "—"}</p>
              <p className="mt-2 font-medium">Evidence</p>
              <p className="break-all text-sm">{item.evidence || "—"}</p>
            </div>

            <div className="border rounded-md p-4 bg-white shadow-sm">
              <p className="font-medium mb-1">Description</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.description || "—"}
              </p>
            </div>
          </div>

          {item.reviewerScore !== null && item.reviewerReason && (
            <div className="border border-blue-200 bg-blue-50/40 p-4 rounded-md">
              <p className="font-medium text-blue-900 mb-2">Reviewer's Evaluation</p>
              <p><strong>Score:</strong> {item.reviewerScore} / {max}</p>
              <p className="mt-1"><strong>Remarks:</strong> {item.reviewerReason}</p>
            </div>
          )}

          {item.isAppealed && item.appealReason && (
            <div className="border border-amber-200 bg-amber-50/40 p-4 rounded-md">
              <p className="font-medium text-amber-900 mb-2">Appeal Information</p>
              <p><strong>Reason:</strong> {item.appealReason}</p>
              {item.appealRequestedScore !== null && (
                <p className="mt-1"><strong>Requested Score:</strong> {item.appealRequestedScore}</p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Final Score</label>
              <Input
                type="number"
                min={0}
                max={max}
                value={type === "pending" ? input.appealerScore : (item.appealerScore ?? "")}
                onChange={(e) => updateAppealInput(id, "appealerScore", e.target.value, max)}
                disabled={type === "resolved"}
                className={type === "resolved" ? "bg-gray-100" : ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Remarks</label>
              <Textarea
                value={type === "pending" ? input.appealerReason : (item.appealerReason ?? "")}
                onChange={(e) => updateAppealInput(id, "appealerReason", e.target.value)}
                placeholder="Enter your remarks..."
                rows={3}
                disabled={type === "resolved"}
                className={type === "resolved" ? "bg-gray-100" : ""}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            {type === "resolved" ? (
              <Badge className="bg-green-600 text-white px-4 py-1.5">Resolved</Badge>
            ) : (
              <Button
                onClick={() => handleAppealReview(item)}
                disabled={isReviewing}
                className="min-w-[140px]"
              >
                {isReviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isReviewing ? "Saving..." : "Submit Review"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout title="Review Appeals" subtitle="Faculty Appeal Review Queue">
      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Appeals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{queue.length + resolvedItems.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-600">{queue.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{resolvedItems.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Input
          placeholder="Search name, email, role, college..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xl"
        />
      </div>

      <div className="space-y-6">
        {isCommittee ? (
          collegeList.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No colleges with appeals found
            </Card>
          ) : (
            <div className="space-y-5">
              {collegeList.map((c) => (
                <Card key={c.college} className="overflow-hidden shadow-md border">
                  <Accordion type="single" collapsible value={openCollege === c.college ? c.college : ""}>
                    <AccordionItem value={c.college} className="border-none">
                      <AccordionTrigger
                        className="px-6 py-5 hover:no-underline bg-slate-50"
                        onClick={() => {
                          setOpenCollege(openCollege === c.college ? null : c.college);
                          setOpenRole(null);
                          setOpenFaculty(null);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-6">
                            <div className="text-4xl font-bold text-primary min-w-[80px] text-left">
                              {c.total}
                            </div>
                            <div className="text-left">
                              <div className="text-2xl font-bold">{c.college}</div>
                              <div className="text-base text-muted-foreground">College</div>
                            </div>
                          </div>

                          {c.pending > 0 ? (
                            <Badge variant="destructive" className="text-base px-5 py-2">
                              {c.pending} pending
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-base px-5 py-2">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 pb-8 pt-4 bg-white">
                        <div className="space-y-4">
                          {getRolesForCollege(c.college).map((r) => (
                            <Card key={r.role} className="border shadow-sm">
                              <Accordion type="single" collapsible value={openRole === r.role ? r.role : ""}>
                                <AccordionItem value={r.role} className="border-none">
                                  <AccordionTrigger
                                    className="px-6 py-4 text-lg font-semibold hover:bg-slate-50"
                                    onClick={() => {
                                      setOpenRole(openRole === r.role ? null : r.role);
                                      setOpenFaculty(null);
                                    }}
                                  >
                                    <div className="flex justify-between w-full items-center">
                                      <span>{r.role}</span>
                                      {r.pending > 0 ? (
                                        <Badge variant="outline" className="border-red-500 text-red-600 px-4 py-1">
                                          {r.pending} pending
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="px-4 py-1">
                                          Reviewed
                                        </Badge>
                                      )}
                                    </div>
                                  </AccordionTrigger>

                                  <AccordionContent className="px-6 pb-6 pt-2">
                                    <div className="space-y-3">
                                      {getFacultyForRole(c.college, r.role).map((f) => (
                                        <Card key={f.email} className="border">
                                          <Accordion type="single" collapsible value={openFaculty === f.email ? f.email : ""}>
                                            <AccordionItem value={f.email} className="border-none">
                                              <AccordionTrigger
                                                className="px-6 py-4 hover:bg-slate-50"
                                                onClick={() => setOpenFaculty(openFaculty === f.email ? null : f.email)}
                                              >
                                                <div className="flex justify-between w-full items-center">
                                                  <div>
                                                    <div className="font-medium text-base">{f.name}</div>
                                                    <div className="text-sm text-muted-foreground">{f.email}</div>
                                                  </div>
                                                  {f.pending > 0 ? (
                                                    <Badge variant="destructive" className="px-3 py-1">
                                                      {f.pending}
                                                    </Badge>
                                                  ) : (
                                                    <Badge variant="secondary" className="px-3 py-1">
                                                      Done
                                                    </Badge>
                                                  )}
                                                </div>
                                              </AccordionTrigger>

                                              <AccordionContent className="px-6 pb-8 pt-4">
                                                {openFaculty === f.email && (
                                                  <div className="space-y-8">
                                                    {Object.keys(criteriaGroups).length === 0 ? (
                                                      <Card className="p-8 text-center text-muted-foreground bg-slate-50">
                                                        No appeals found for this faculty member
                                                      </Card>
                                                    ) : (
                                                      <Accordion type="single" collapsible className="space-y-5">
                                                        {Object.entries(criteriaGroups).map(([crit, { pending, resolved }]) => (
                                                          <Card key={crit} className="border shadow-sm">
                                                            <AccordionItem value={crit} className="border-none">
                                                              <AccordionTrigger className="px-6 py-4 text-base font-medium">
                                                                {crit}
                                                                <div className="ml-auto flex gap-8 text-sm font-normal pr-2">
                                                                  <span className="text-red-600">Pending: {pending.length}</span>
                                                                  <span className="text-green-700">Resolved: {resolved.length}</span>
                                                                </div>
                                                              </AccordionTrigger>

                                                              <AccordionContent className="px-6 pb-8 pt-4 space-y-10">
                                                                <div>
                                                                  <h4 className="text-xl font-semibold text-red-600 mb-5">Pending Appeals</h4>
                                                                  {pending.length === 0 ? (
                                                                    <div className="text-center py-10 bg-slate-50 rounded-lg text-muted-foreground">
                                                                      No pending appeals
                                                                    </div>
                                                                  ) : (
                                                                    <div className="space-y-6">
                                                                      {pending.map((item) => renderAppealCard(item, "pending"))}
                                                                    </div>
                                                                  )}
                                                                </div>

                                                                <div>
                                                                  <h4 className="text-lg font-semibold text-green-700 mb-5">Resolved Appeals</h4>
                                                                  {resolved.length === 0 ? (
                                                                    <div className="text-center py-10 bg-slate-50 rounded-lg text-muted-foreground">
                                                                      No resolved appeals yet
                                                                    </div>
                                                                  ) : (
                                                                    <div className="space-y-6">
                                                                      {resolved.map((item) => renderAppealCard(item, "resolved"))}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              </AccordionContent>
                                                            </AccordionItem>
                                                          </Card>
                                                        ))}
                                                      </Accordion>
                                                    )}
                                                  </div>
                                                )}
                                              </AccordionContent>
                                            </AccordionItem>
                                          </Accordion>
                                        </Card>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold">Faculty with Appeals</h2>
            {facultyList.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground bg-slate-50">
                No appeals available
              </Card>
            ) : (
              facultyList.map((f) => (
                <Card key={f.email} className="shadow-md hover:shadow-lg transition-shadow">
                  <Accordion type="single" collapsible value={openFaculty === f.email ? f.email : ""}>
                    <AccordionItem value={f.email} className="border-none">
                      <AccordionTrigger className="px-6 py-5">
                        <div className="flex justify-between w-full items-center">
                          <div>
                            <div className="text-xl font-semibold">{f.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">{f.email} • {f.role}</div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-2xl font-bold">{f.total}</div>
                              <div className="text-sm text-muted-foreground">Appeals</div>
                            </div>
                            {f.pending > 0 ? (
                              <Badge variant="destructive" className="text-base px-4 py-2">
                                {f.pending} pending
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-base px-4 py-2">
                                All clear
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 pb-8 pt-4">
                        {openFaculty === f.email && (
                          <div className="space-y-8">
                            {Object.keys(criteriaGroups).length === 0 ? (
                              <Card className="p-10 text-center text-muted-foreground bg-slate-50">
                                No appeals found
                              </Card>
                            ) : (
                              <Accordion type="single" collapsible className="space-y-5">
                                {Object.entries(criteriaGroups).map(([crit, { pending, resolved }]) => (
                                  <Card key={crit} className="border shadow-sm">
                                    <AccordionItem value={crit} className="border-none">
                                      <AccordionTrigger className="px-6 py-4 text-base font-medium">
                                        {crit}
                                        <div className="ml-auto flex gap-10 text-sm">
                                          <span className="text-red-600">Pending: {pending.length}</span>
                                          <span className="text-green-700">Resolved: {resolved.length}</span>
                                        </div>
                                      </AccordionTrigger>

                                      <AccordionContent className="px-6 pb-8 pt-4 space-y-10">
                                        <div>
                                          <h4 className="text-lg font-semibold text-red-600 mb-5">Pending Appeals</h4>
                                          {pending.length === 0 ? (
                                            <div className="text-center py-10 bg-slate-50 rounded-lg text-muted-foreground">
                                              No pending appeals
                                            </div>
                                          ) : (
                                            <div className="space-y-6">
                                              {pending.map((item) => renderAppealCard(item, "pending"))}
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <h4 className="text-lg font-semibold text-green-700 mb-5">Resolved Appeals</h4>
                                          {resolved.length === 0 ? (
                                            <div className="text-center py-10 bg-slate-50 rounded-lg text-muted-foreground">
                                              No resolved appeals yet
                                            </div>
                                          ) : (
                                            <div className="space-y-6">
                                              {resolved.map((item) => renderAppealCard(item, "resolved"))}
                                            </div>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Card>
                                ))}
                              </Accordion>
                            )}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}