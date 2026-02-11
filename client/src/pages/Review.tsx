import { useState, useEffect } from "react";
import { api } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileText, TrendingUp } from "lucide-react";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);
  const [expandedSubsections, setExpandedSubsections] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.role !== "hod") return;

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/module1/all-submissions"); // your correct API
        setSubmissions(res.data.data || []);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch submissions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, toast]);

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout title="Review Submissions">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Filter by faculty name or ID
  const filteredSubmissions = submissions.filter(
    (f) =>
      f.facultyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.facultyId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateCriterionField = (
    facultyId: string,
    module: string,
    subId: string,
    criterionName: string,
    field: "hodScore" | "hodDescription",
    value: number | string
  ) => {
    setSubmissions((prev) =>
      prev.map((faculty) =>
        faculty.facultyId !== facultyId
          ? faculty
          : {
              ...faculty,
              subsections: faculty.subsections.map((sub: any) =>
                sub.module !== module || sub.id !== subId
                  ? sub
                  : {
                      ...sub,
                      criteria: sub.criteria.map((c: any) =>
                        c.name !== criterionName ? c : { ...c, [field]: value }
                      ),
                    }
              ),
            }
      )
    );
  };

  const renderFacultyCard = (faculty: any, type: "pending" | "verified") => {
    if (!faculty.subsections) return null;

    const filteredSubsections = faculty.subsections
      .map((sub: any) => ({
        ...sub,
        criteria:
          type === "pending"
            ? sub.criteria.filter((c: any) => !c.isVerified)
            : sub.criteria.filter((c: any) => c.isVerified),
      }))
      .filter((sub: any) => sub.criteria.length > 0);

    if (filteredSubsections.length === 0) return null;

    // Unique key including all module IDs to avoid duplicates
    const facultyKey = `${faculty.facultyId}-${type}-${filteredSubsections.map((s: any) => s.id).join(",")}`;

    return (
      <Card key={facultyKey} className="border shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-base font-semibold">{faculty.facultyName || "-"}</CardTitle>
            <p className="text-xs text-muted-foreground">Faculty ID: {faculty.facultyId || "-"}</p>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() =>
              setExpandedFaculty(expandedFaculty === facultyKey ? null : facultyKey)
            }
          >
            {expandedFaculty === facultyKey ? "Hide" : "View"}
          </Button>
        </CardHeader>

        {expandedFaculty === facultyKey && (
          <CardContent className="space-y-4">
            {filteredSubsections.map((sub: any) => {
              const subKey = `${faculty.facultyId}-${sub.module || "unknown"}-${sub.id}-${type}`;
              const isExpanded = expandedSubsections.includes(subKey);

              return (
                <div key={subKey} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-primary">
                      [{(sub.module || "UNKNOWN").toUpperCase()}] {sub.name || "-"}
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() =>
                        setExpandedSubsections((prev) =>
                          prev.includes(subKey)
                            ? prev.filter((k) => k !== subKey)
                            : [...prev, subKey]
                        )
                      }
                    >
                      {isExpanded ? "Hide Details" : "Show Details"}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4">
                      {sub.criteria.map((c: any) => {
                        const key = `${faculty.facultyId}-${sub.module || "unknown"}-${sub.id}-${c.name}`;

                        return (
                          <div
                            key={key}
                            className={`grid md:grid-cols-3 gap-4 p-3 rounded-md border ${
                              c.isVerified ? "bg-green-50 border-green-200" : "bg-muted/40"
                            }`}
                          >
                            <div className="text-xs space-y-1">
                              <p>
                                <strong>Criterion:</strong> {c.name}
                              </p>
                              <p>
                                <strong>Max:</strong> {c.maxScore}
                              </p>
                              <p>
                                <strong>Claimed:</strong> {c.claimedScore}
                              </p>
                            </div>

                            <div className="text-xs">
                              <p className="font-semibold mb-1">Faculty Description</p>
                              <p className="whitespace-pre-wrap">
                                {c.description || c.facultyDescription || "-"}
                              </p>
                            </div>

                            <div className="text-xs space-y-3">
                              <div>
                                <label className="block mb-1 font-medium">HOD Score</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={c.maxScore}
                                  disabled={c.isVerified}
                                  value={c.hodScore ?? ""}
                                  onChange={(e) =>
                                    updateCriterionField(
                                      faculty.facultyId,
                                      sub.module || "",
                                      sub.id,
                                      c.name,
                                      "hodScore",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="border rounded px-2 py-1 w-20 text-xs"
                                />
                              </div>

                              <div>
                                <label className="block mb-1 font-medium">HOD Remarks</label>
                                <textarea
                                  disabled={c.isVerified}
                                  value={c.hodDescription ?? ""}
                                  placeholder="Enter remarks / justification..."
                                  onChange={(e) =>
                                    updateCriterionField(
                                      faculty.facultyId,
                                      sub.module || "",
                                      sub.id,
                                      c.name,
                                      "hodDescription",
                                      e.target.value
                                    )
                                  }
                                  className="border rounded p-2 w-full min-h-[70px] text-xs"
                                />
                              </div>

                              {c.isVerified ? (
                                <Button
                                  size="sm"
                                  disabled
                                  className="text-xs bg-green-600 hover:bg-green-600 text-white"
                                >
                                  Verified
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="text-xs"
                                  disabled={
                                    !c.hodDescription?.trim() ||
                                    c.hodScore == null ||
                                    c.hodScore < 0 ||
                                    verifying[key]
                                  }
                                  onClick={async () => {
                                    setVerifying((v) => ({ ...v, [key]: true }));
                                    try {
                                      await api.put(
                                        `/api/${sub.module || "unknown"}/verify/${faculty.facultyId}/${sub.id}/${encodeURIComponent(
                                          c.name
                                        )}`,
                                        {
                                          hodScore: c.hodScore,
                                          hodDescription: c.hodDescription,
                                        }
                                      );

                                      setSubmissions((prev) =>
                                        prev.map((f) =>
                                          f.facultyId !== faculty.facultyId
                                            ? f
                                            : {
                                                ...f,
                                                subsections: f.subsections.map((s: any) =>
                                                  s.id !== sub.id || s.module !== sub.module
                                                    ? s
                                                    : {
                                                        ...s,
                                                        criteria: s.criteria.map((cr: any) =>
                                                          cr.name === c.name
                                                            ? { ...cr, isVerified: true }
                                                            : cr
                                                        ),
                                                      }
                                                ),
                                              }
                                        )
                                      );

                                      toast({
                                        title: "Success",
                                        description: "Criterion verified successfully",
                                      });
                                    } catch (err) {
                                      toast({
                                        title: "Error",
                                        description: "Verification failed",
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setVerifying((v) => ({ ...v, [key]: false }));
                                    }
                                  }}
                                >
                                  {verifying[key] ? "Verifying..." : "Verify"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <DashboardLayout title="Review Submissions" subtitle="Faculty Submissions Review">
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
            <p className="text-3xl font-bold font-display">{submissions.length}</p>
            <p className="text-xs text-muted-foreground">faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-destructive">
              {submissions.filter((f) =>
                f.subsections?.some((s: any) => s.criteria?.some((c: any) => !c.isVerified))
              ).length}
            </p>
            <p className="text-xs text-muted-foreground">submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-success">
              {submissions.filter((f) =>
                f.subsections?.some((s: any) => s.criteria?.some((c: any) => c.isVerified))
              ).length}
            </p>
            <p className="text-xs text-muted-foreground">submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Box */}
      <div className="mb-6 w-full md:w-full">
        <input
          type="text"
          placeholder="Search by Faculty Name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm"
        />
      </div>

      {/* Pending Review */}
      <h2 className="text-lg font-semibold mb-4">Pending Review</h2>
      <div className="space-y-6 mb-12">
        {filteredSubmissions.map((f) => renderFacultyCard(f, "pending"))}
        {filteredSubmissions.every(
          (f) => !f.submissions?.some((s: any) => s.criteria?.some((c: any) => !c.isVerified))
        ) && (
          <p className="text-center text-muted-foreground py-8">
            No pending submissions to review.
          </p>
        )}
      </div>

      {/* Verified Submissions */}
      <h2 className="text-lg font-semibold mb-4">Verified Submissions</h2>
      <div className="space-y-6">
        {filteredSubmissions.map((f) => renderFacultyCard(f, "verified"))}
        {filteredSubmissions.every(
          (f) => !f.submissions?.some((s: any) => s.criteria?.some((c: any) => c.isVerified))
        ) && (
          <p className="text-center text-muted-foreground py-8">No verified submissions yet.</p>
        )}
      </div>
    </DashboardLayout>
  );
}