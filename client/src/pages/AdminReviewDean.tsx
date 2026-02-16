import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Criterion = {
  name: string;
  claimedScore: number;
  maxScore: number;
  deanDescription?: string;
  evidence?: string;
  adminScore?: number | null;
  adminDescription?: string;
  isVerified?: boolean;
};

type Subsection = {
  id: string;
  name: string;
  criteria: Criterion[];
};

type DeanSubmission = {
  deanId: string;
  deanName: string;
  department: string;
  college: string;
  moduleName: string;
  subsections: Subsection[];
};

export default function AdminReview() {
  const { user } = useAuth();
  const { toast } = useToast();

  const modules = ["module1", "module1_B"];

  const [allSubmissions, setAllSubmissions] = useState<DeanSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDean, setExpandedDean] = useState<string | null>(null);
  const [expandedSubs, setExpandedSubs] = useState<string[]>([]);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

  // 🔥 FAST PARALLEL LOADING
  const loadData = async () => {
    try {
      setLoading(true);

      const responses = await Promise.all(
        modules.map((moduleName) =>
          api.get(`/api/dean/admin/${moduleName}/all-submissions`)
        )
      );

      const combined: DeanSubmission[] = [];

      responses.forEach((res, index) => {
        const moduleName = modules[index];
        const submissions = res.data.data || [];

        submissions.forEach((s: any) => {
          combined.push({
            ...s,
            moduleName,
          });
        });
      });

      setAllSubmissions(combined);
    } catch {
      toast({
        title: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  // 🔥 VERIFY
  const verifyCriterion = async (
    moduleName: string,
    deanId: string,
    subId: string,
    criterionName: string,
    adminScore: number,
    adminDescription: string
  ) => {
    const key = `${moduleName}-${deanId}-${subId}-${criterionName}`;

    try {
      setVerifying((prev) => ({ ...prev, [key]: true }));

      await api.put(
        `/api/dean/admin/${moduleName}/verify/${deanId}/${subId}/${encodeURIComponent(
          criterionName
        )}`,
        { adminScore, adminDescription }
      );

      toast({ title: "Verified successfully" });
      loadData();
    } catch {
      toast({
        title: "Verification failed",
        variant: "destructive",
      });
    } finally {
      setVerifying((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (!user || user.role !== "admin") return null;

  if (loading) {
    return (
      <DashboardLayout title="Admin Review">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const pendingDeans = allSubmissions.filter((d) =>
    d.subsections.some((s) =>
      s.criteria.some((c) => !c.isVerified)
    )
  );

  const verifiedDeans = allSubmissions.filter((d) =>
    d.subsections.some((s) =>
      s.criteria.some((c) => c.isVerified)
    )
  );

  const renderDean = (
    dean: DeanSubmission,
    type: "pending" | "verified"
  ) => {
    const deanKey = `${dean.moduleName}-${dean.deanId}-${type}`;

    const filteredSubs = dean.subsections
      .map((s) => ({
        ...s,
        criteria:
          type === "pending"
            ? s.criteria.filter((c) => !c.isVerified)
            : s.criteria.filter((c) => c.isVerified),
      }))
      .filter((s) => s.criteria.length > 0);

    if (!filteredSubs.length) return null;

    return (
      <Card key={deanKey} className="shadow-md border">
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle>{dean.deanName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {dean.department} • {dean.college} • {dean.moduleName}
            </p>
          </div>
          <Button
            size="sm"
            className="w-[200px]"
            onClick={() =>
              setExpandedDean(expandedDean === deanKey ? null : deanKey)
            }
          >
            {expandedDean === deanKey ? "Hide" : "View"}
          </Button>
        </CardHeader>

        {expandedDean === deanKey && (
          <CardContent className="space-y-6">
            {filteredSubs.map((sub) => {
              const subKey = `${deanKey}-${sub.id}`;
              const open = expandedSubs.includes(subKey);

              return (
                <div key={sub.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">{sub.name}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setExpandedSubs((prev) =>
                          prev.includes(subKey)
                            ? prev.filter((x) => x !== subKey)
                            : [...prev, subKey]
                        )
                      }
                    >
                      {open ? "Hide Criteria" : "Show Criteria"}
                    </Button>
                  </div>

                  {open &&
                    sub.criteria.map((c) => {
                      const key = `${dean.moduleName}-${dean.deanId}-${sub.id}-${c.name}`;
                      const isVerifying = verifying[key];

                      return (
                        <div
                          key={c.name}
                          className="border p-4 rounded-md mb-4 bg-muted/20"
                        >
                          <div className="font-semibold mb-2">
                            {c.name}
                          </div>

                          <div className="text-sm mb-1">
                            Claimed: {c.claimedScore} / {c.maxScore}
                          </div>

                          <div className="text-sm mb-1">
                            <strong>Dean Description:</strong>{" "}
                            {c.deanDescription || "-"}
                          </div>

                          <div className="text-sm mb-3">
                            <strong>Evidence:</strong>{" "}
                            {c.evidence || "-"}
                          </div>

                          {type === "pending" ? (
                            <>
                              <Input
                                type="number"
                                placeholder="Admin Score"
                                className="mb-2"
                                defaultValue={c.claimedScore}
                                onChange={(e) =>
                                  (c.adminScore = Number(e.target.value))
                                }
                              />

                              <Textarea
                                placeholder="Admin Remarks"
                                className="mb-3"
                                onChange={(e) =>
                                  (c.adminDescription = e.target.value)
                                }
                              />

                              <Button
                                disabled={isVerifying}
                                onClick={() =>
                                  verifyCriterion(
                                    dean.moduleName,
                                    dean.deanId,
                                    sub.id,
                                    c.name,
                                    c.adminScore ?? 0,
                                    c.adminDescription ?? ""
                                  )
                                }
                              >
                                {isVerifying
                                  ? "Verifying..."
                                  : "Verify"}
                              </Button>
                            </>
                          ) : (
                            <div className="text-green-600 font-medium">
                              ✅ Verified | Admin Score: {c.adminScore}
                              <br />
                              <span className="text-sm text-muted-foreground">
                                {c.adminDescription}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <DashboardLayout title="Admin Review">
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Review</h2>
          <div className="space-y-6">
            {pendingDeans.map((d) => renderDean(d, "pending"))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Verified</h2>
          <div className="space-y-6">
            {verifiedDeans.map((d) => renderDean(d, "verified"))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}