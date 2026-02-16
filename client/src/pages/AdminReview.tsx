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
  adminScore?: number | null;
  adminDescription?: string;
  isVerified?: boolean;
};

type Subsection = {
  id: string;
  name: string;
  criteria: Criterion[];
};

type HodSubmission = {
  hodId: string;
  hodName: string;
  department: string;
  college: string;
  moduleName: string;
  subsections: Subsection[];
};

export default function AdminReview() {
  const { user } = useAuth();
  const { toast } = useToast();

  const modules = ["module1","module_B"];

  const [data, setData] = useState<HodSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedHod, setExpandedHod] = useState<string | null>(null);
  const [expandedSubs, setExpandedSubs] = useState<string[]>([]);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const [formState, setFormState] = useState<
    Record<string, { score: number; desc: string }>
  >({});

  
  const loadData = async () => {
    try {
      setLoading(true);

      const responses = await Promise.all(
        modules.map((moduleName) =>
          api.get(`/api/hod/parta/admin/${moduleName}/all-submissions`)
        )
      );

      const combined: HodSubmission[] = [];

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

      setData(combined);
    } catch (err) {
      toast({
        title: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") loadData();
  }, [user]);

  // ✅ VERIFY FUNCTION FIXED
  const verifyCriterion = async (
    moduleName: string,
    hodId: string,
    subId: string,
    criterionName: string
  ) => {
    const key = `${moduleName}-${hodId}-${subId}-${criterionName}`;
    const form = formState[key];

    if (!form) return;

    try {
      setVerifying((v) => ({ ...v, [key]: true }));

      await api.put(
        `/api/hod/parta/admin/${moduleName}/verify/${hodId}/${subId}/${encodeURIComponent(
          criterionName
        )}`,
        {
          adminScore: form.score,
          adminDescription: form.desc,
        }
      );

      toast({ title: "Criterion verified" });
      loadData();
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setVerifying((v) => ({ ...v, [key]: false }));
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

  const filtered = data.filter(
    (h) =>
      h.hodName.toLowerCase().includes(search.toLowerCase()) ||
      h.department.toLowerCase().includes(search.toLowerCase())
  );

  const renderHodCard = (hod: HodSubmission, type: "pending" | "verified") => {
    const subs = hod.subsections
      .map((s) => ({
        ...s,
        criteria:
          type === "pending"
            ? s.criteria.filter((c) => !c.isVerified)
            : s.criteria.filter((c) => c.isVerified),
      }))
      .filter((s) => s.criteria.length > 0);

    if (subs.length === 0) return null;

    const hodKey = `${hod.moduleName}-${hod.hodId}-${type}`;

    return (
      <Card key={hodKey} className="border shadow-sm">
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>{hod.hodName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {hod.department} • {hod.college} • {hod.moduleName}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setExpandedHod(expandedHod === hodKey ? null : hodKey)
            }
          >
            {expandedHod === hodKey ? "Hide" : "View"}
          </Button>
        </CardHeader>

        {expandedHod === hodKey && (
          <CardContent className="space-y-4">
            {subs.map((sub) => {
              const subKey = `${hodKey}-${sub.id}`;
              const open = expandedSubs.includes(subKey);

              return (
                <div key={sub.id} className="border rounded-lg">
                  <div className="flex justify-between p-3 bg-muted/40">
                    <h3 className="font-medium">{sub.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExpandedSubs((p) =>
                          p.includes(subKey)
                            ? p.filter((x) => x !== subKey)
                            : [...p, subKey]
                        )
                      }
                    >
                      {open ? "Hide" : "Show"}
                    </Button>
                  </div>

                  {open && (
                    <div className="p-4 space-y-4">
                      {sub.criteria.map((c) => {
                        const key = `${hod.moduleName}-${hod.hodId}-${sub.id}-${c.name}`;
                        const isVerifying = verifying[key];

                        if (!formState[key]) {
                          formState[key] = {
                            score: c.adminScore ?? c.claimedScore,
                            desc: c.adminDescription ?? "",
                          };
                        }

                        return (
                          <div
                            key={c.name}
                            className={`p-4 border rounded-lg ${
                              c.isVerified
                                ? "bg-green-50 border-green-200"
                                : "bg-muted/30"
                            }`}
                          >
                            <div className="font-medium">{c.name}</div>
                            <div className="text-sm mb-2">
                              Claimed: {c.claimedScore} / {c.maxScore}
                            </div>

                            {type === "pending" ? (
                              <>
                                <Input
                                  type="number"
                                  className="mb-2"
                                  value={formState[key]?.score}
                                  onChange={(e) =>
                                    setFormState((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        score: Number(e.target.value),
                                      },
                                    }))
                                  }
                                />
                                <Textarea
                                  className="mb-2"
                                  placeholder="Admin remarks"
                                  value={formState[key]?.desc}
                                  onChange={(e) =>
                                    setFormState((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        desc: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <Button
                                  disabled={isVerifying}
                                  onClick={() =>
                                    verifyCriterion(
                                      hod.moduleName,
                                      hod.hodId,
                                      sub.id,
                                      c.name
                                    )
                                  }
                                >
                                  {isVerifying ? "Verifying..." : "Verify"}
                                </Button>
                              </>
                            ) : (
                              <div className="text-green-600 font-medium">
                                Verified | Score: {c.adminScore}
                                <div className="text-sm text-muted-foreground">
                                  {c.adminDescription}
                                </div>
                              </div>
                            )}
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
    <DashboardLayout title="Admin Review">
      <div className="space-y-6">
        <Input
          placeholder="Search HOD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Review</h2>
          <div className="space-y-6">
            {filtered.map((h) => renderHodCard(h, "pending"))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Verified Submissions
          </h2>
          <div className="space-y-6">
            {filtered.map((h) => renderHodCard(h, "verified"))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}