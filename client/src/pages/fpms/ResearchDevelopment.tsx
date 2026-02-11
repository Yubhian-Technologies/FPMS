import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/api/api";

export default function ResearchConsultancy() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subCriteria, setSubCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- DEFAULT STRUCTURE ---------------- */
  const defaultSubCriteria = [
    {
      id: "3.1",
      title: "Publications",
      maxPoints: 20,
      description: "Quartiles, IF, indexed conferences, book chapters",
      subItems: [
        {
          name: "Research Publications",
          maxScore: 20,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
    {
      id: "3.2",
      title: "Citations & h-index Growth",
      maxPoints: 5,
      description: "0.2 per citation excluding self/co-author",
      subItems: [
        {
          name: "Citations / h-index",
          maxScore: 5,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
    {
      id: "3.3",
      title: "Patents / Creative Works",
      maxPoints: 10,
      description: "Indian / USA utility patents only",
      subItems: [
        {
          name: "Patents / Creative Works",
          maxScore: 10,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
    {
      id: "3.4",
      title: "Sponsored Projects",
      maxPoints: 18,
      description: "Funding slabs, PI / Co-PI points",
      subItems: [
        {
          name: "Sponsored Research Projects",
          maxScore: 18,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
    {
      id: "3.5",
      title: "Seed Funding",
      maxPoints: 4,
      description: "Internal seed funding projects",
      subItems: [
        {
          name: "Seed Funding Projects",
          maxScore: 4,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
    {
      id: "3.6",
      title: "Consultancy / Training",
      maxPoints: 10,
      description: "External consultancy and training",
      subItems: [
        {
          name: "Consultancy / Training Programs",
          maxScore: 10,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
    {
      id: "3.7",
      title: "PhD Supervision",
      maxPoints: 4,
      description: "Tenure ≤ 5 years",
      subItems: [
        {
          name: "PhD Supervision",
          maxScore: 4,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
    {
      id: "3.8",
      title: "Research Services",
      maxPoints: 4,
      description: "Reviewer / editor / events",
      subItems: [
        {
          name: "Research Services",
          maxScore: 4,
          claimedScore: 0,
          description: "",
          evidence: "",
          isVerified: false,
        },
      ],
    },
  ];

  /* ---------------- FETCH DATA ---------------- */
  const fetchSubmissions = async () => {
    if (!user?.id) {
      setSubCriteria(defaultSubCriteria);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/api/module3/faculty/${user.id}`);
      const backendData = res.data?.data || [];

      const merged = defaultSubCriteria.map((sc) => {
        const existing = backendData.find((b: any) => b.id === sc.id);

        return {
          ...sc,
          subItems: sc.subItems.map((si) => {
            const item = existing?.criteria?.find(
              (c: any) => c.name === si.name,
            );

            return item
              ? {
                  ...si,
                  claimedScore: item.claimedScore ?? 0,
                  description: item.facultyDescription ?? "",
                  evidence: item.evidence ?? "",
                  isVerified: item.isVerified ?? false,
                  committeeScore: item.committeeScore,
                }
              : si;
          }),
        };
      });

      setSubCriteria(merged);
    } catch (err) {
      console.error('Research data fetch error:', err);
      setSubCriteria(defaultSubCriteria);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user?.id]);

  /* ---------------- HELPERS ---------------- */
  const updateSubItem = (
    subId: string,
    index: number,
    field: string,
    value: any,
  ) => {
    setSubCriteria((prev) =>
      prev.map((sc) =>
        sc.id !== subId
          ? sc
          : {
              ...sc,
              subItems: sc.subItems.map((si, i) =>
                i === index ? { ...si, [field]: value } : si,
              ),
            },
      ),
    );
  };

  const getSubStatus = (sub: any) => {
    const hasScore = sub.subItems.some((si: any) => si.claimedScore > 0);
    const allVerified = sub.subItems.every((si: any) => si.isVerified);
    if (allVerified) return "completed";
    if (hasScore) return "in-progress";
    return "not-started";
  };

  const saveSingleCriterion = async (subId: string, criterion: any) => {
    if (!user) return;

    try {
      await api.post(
        `/api/module3/faculty/${user.id}/subsection/${encodeURIComponent(subId)}`,
        {
          criteria: [
            {
              name: criterion.name,
              claimedScore: criterion.claimedScore,
              maxScore: criterion.maxScore,
              description: criterion.description,
              evidence: criterion.evidence,
            },
          ],
        },
      );
      toast({ title: "Saved", description: "Criterion saved successfully" });
      fetchSubmissions();
    } catch {
      toast({
        title: "Save failed",
        description: "Check backend",
        variant: "destructive",
      });
    }
  };

  const saveSubsection = async (sub: any) => {
    if (!user) return;

    try {
      await api.post(
        `/api/module3/faculty/${user.id}/subsection/${encodeURIComponent(sub.id)}`,
        {
          criteria: sub.subItems.map((si: any) => ({
            name: si.name,
            claimedScore: si.claimedScore,
            maxScore: si.maxScore,
            description: si.description,
            evidence: si.evidence,
          })),
        },
      );
      toast({ title: "Saved", description: "Subsection saved successfully" });
      fetchSubmissions();
    } catch {
      toast({
        title: "Save failed",
        description: "Check backend",
        variant: "destructive",
      });
    }
  };

  if (loading) return <p>Loading...</p>;

  const totalMax = subCriteria.reduce((s, sc) => s + sc.maxPoints, 0);
  const totalClaimed = subCriteria.reduce(
    (s, sc) =>
      s +
      sc.subItems.reduce((x: number, si: any) => x + (si.claimedScore || 0), 0),
    0,
  );

  return (
    <DashboardLayout
      title="Research & Consultancy"
      subtitle="Criterion 2 • Maximum 75 Points"
    >
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex justify-between mb-2">
              <span>Overall Progress</span>
              <span>
                {totalClaimed} / {totalMax}
              </span>
            </div>
            <Progress value={(totalClaimed / totalMax) * 100} className="h-3" />
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          {subCriteria.map((sub) => (
            <AccordionItem
              key={sub.id}
              value={sub.id}
              className="border rounded-lg"
            >
              <AccordionTrigger className="flex justify-between items-center px-4">
                <span>
                  {sub.id} - {sub.title}
                </span>
                <Badge
                  variant={
                    getSubStatus(sub) === "completed"
                      ? "default"
                      : getSubStatus(sub) === "in-progress"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {getSubStatus(sub) === "completed"
                    ? "Verified"
                    : getSubStatus(sub) === "in-progress"
                      ? "In Progress"
                      : "Not Started"}
                </Badge>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4 space-y-4">
                {sub.subItems.map((si: any, i: number) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle>{si.name}</CardTitle>
                      {si.isVerified && (
                        <Badge className="bg-blue-800 text-white">
                          Verified
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div>
                        <label>Claimed Score (Max {si.maxScore})</label>
                        <input
                          type="number"
                          min={0}
                          max={si.maxScore}
                          value={si.claimedScore}
                          disabled={si.isVerified}
                          onChange={(e) =>
                            updateSubItem(
                              sub.id,
                              i,
                              "claimedScore",
                              Number(e.target.value),
                            )
                          }
                          className="w-full border rounded p-2"
                        />
                      </div>

                      <div>
                        <label>Description</label>
                        <textarea
                          value={si.description}
                          disabled={si.isVerified}
                          onChange={(e) =>
                            updateSubItem(
                              sub.id,
                              i,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full border rounded p-2"
                        />
                      </div>

                      <div>
                        <label>Evidence URL</label>
                        <input
                          type="text"
                          value={si.evidence}
                          disabled={si.isVerified}
                          onChange={(e) =>
                            updateSubItem(sub.id, i, "evidence", e.target.value)
                          }
                          className="w-full border rounded p-2"
                        />
                      </div>

                      {!si.isVerified && (
                        <Button onClick={() => saveSingleCriterion(sub.id, si)}>
                          Save This Criterion
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={() => saveSubsection(sub)}>
                  Save Entire Subsection
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
