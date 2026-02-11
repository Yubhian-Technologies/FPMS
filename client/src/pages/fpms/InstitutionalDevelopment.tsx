import { useState, useEffect } from "react";
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

export default function InstitutionalDevelopment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subCriteria, setSubCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- DEFAULT STRUCTURE ---------------- */
  const defaultSubCriteria = [
    {
      id: "5.1",
      title: "Industry Collaboration/MoU",
      maxPoints: 12,
      subItems: [
        { name: "Guest Speakers", claimedScore: 0, maxScore: 4, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
        { name: "Internship Monitoring", claimedScore: 0, maxScore: 8, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
      ],
    },
    {
      id: "5.2",
      title: "University MoU + Implementation",
      maxPoints: 5,
      subItems: [
        { name: "MoU Signed", claimedScore: 0, maxScore: 2, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
        { name: "Implementation Report", claimedScore: 0, maxScore: 3, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
      ],
    },
    {
      id: "5.3",
      title: "Special Labs/CoE",
      maxPoints: 8,
      subItems: [
        { name: "Coordinator Role", claimedScore: 0, maxScore: 4, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
        { name: "Co-Coordinator Role", claimedScore: 0, maxScore: 4, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
      ],
    },
    {
      id: "5.4",
      title: "Software/Apps/Hardware/Alumni",
      maxPoints: 8,
      subItems: [
        { name: "Development", claimedScore: 0, maxScore: 4, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
        { name: "Alumni Engagement", claimedScore: 0, maxScore: 4, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
      ],
    },
    {
      id: "5.5",
      title: "Institutional/Dept Responsibilities",
      maxPoints: 12,
      subItems: [
        { name: "Institutional Responsibilities", claimedScore: 0, maxScore: 6, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
        { name: "Department Responsibilities", claimedScore: 0, maxScore: 6, evidence: "", description: "", hodDescription: "", hodScore: undefined, committeeScore: undefined, committeeRemarks: "", isVerified: false },
      ],
    },
  ];

  /* ---------------- FETCH BACKEND + APPEALS DATA ---------------- */
  const fetchSubmissions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // 1️⃣ Module 5 submission
      const res = await api.get(`/api/module5/faculty/${user.id}`);
      const backendData = res.data?.data || [];

      // 2️⃣ Appeals submitted by faculty (committee verified)
      const appealsRes = await api.get(`/api/appeal/${user.id}`);
      const appealsData = appealsRes.data?.data || [];

      // Map appeals for easy lookup
      const appealsMap: Record<string, any> = {};
      appealsData.forEach((a: any) => {
        if (a.status === "committee_verified") {
          appealsMap[`${a.subId}-${a.criterionName}`] = a;
        }
      });

      // 3️⃣ Merge backend + default + appeals
      const merged = defaultSubCriteria.map((sc) => {
        const existing = backendData.find((b: any) => b.id === sc.id);

        return {
          ...sc,
          subItems: sc.subItems.map((si) => {
            const item = existing?.criteria?.find((c: any) => c.name === si.name);
            const appeal = appealsMap[`${sc.id}-${si.name}`];

            // Compute final score
            const finalScore =
              appeal?.committeeScore != null
                ? Number(appeal.committeeScore)
                : item?.hodScore != null
                ? Number(item.hodScore)
                : Number(item?.claimedScore ?? 0);

            return {
              ...si,
              claimedScore: item?.claimedScore ?? si.claimedScore,
              evidence: item?.evidence ?? si.evidence,
              description: item?.facultyDescription ?? si.description,
              hodDescription: item?.hodDescription ?? si.hodDescription,
              hodScore: item?.hodScore != null ? Number(item.hodScore) : undefined,
              committeeScore: appeal?.committeeScore != null
                ? Number(appeal.committeeScore)
                : item?.committeeScore != null
                ? Number(item.committeeScore)
                : undefined,
              committeeRemarks: appeal?.committeeRemarks ?? item?.committeeRemarks ?? "",
              isVerified: appeal?.verifiedByCommittee ?? item?.isVerified ?? false,
              finalScore,
            };
          }),
        };
      });

      setSubCriteria(merged);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  /* ---------------- UPDATE FIELDS ---------------- */
  const updateSubItem = (subId: string, index: number, field: string, value: any) => {
    setSubCriteria((prev) =>
      prev.map((sc) =>
        sc.id !== subId
          ? sc
          : {
              ...sc,
              subItems: sc.subItems.map((si, i) =>
                i === index ? { ...si, [field]: value } : si
              ),
            }
      )
    );
  };

  const getSubStatus = (sub: any) => {
    const allVerified = sub.subItems.every((si: any) => si.isVerified);
    const hasScore = sub.subItems.some((si: any) => si.claimedScore > 0);
    if (allVerified) return "completed";
    if (hasScore) return "in-progress";
    return "not-started";
  };

  /* ---------------- SAVE FUNCTIONS ---------------- */
  const saveSingleCriterion = async (subId: string, criterion: any) => {
    if (!user || criterion.hodScore != null || criterion.committeeScore != null) return;
    try {
      await api.post(
        `/api/module5/faculty/${user.id}/subsection/${encodeURIComponent(subId)}`,
        {
          criteria: [
            {
              name: criterion.name,
              claimedScore: Number(criterion.claimedScore),
              maxScore: Number(criterion.maxScore),
              description: criterion.description ?? "",
              evidence: criterion.evidence ?? "",
            },
          ],
        }
      );
      toast({ title: "Saved", description: "Criterion saved successfully" });
      fetchSubmissions();
    } catch {
      toast({ title: "Save failed", description: "Check backend", variant: "destructive" });
    }
  };

  const saveSubsection = async (sub: any) => {
    if (!user || sub.subItems.some((si) => si.hodScore != null || si.committeeScore != null)) return;
    try {
      await api.post(
        `/api/module5/faculty/${user.id}/subsection/${encodeURIComponent(sub.id)}`,
        {
          criteria: sub.subItems.map((si: any) => ({
            name: si.name,
            claimedScore: Number(si.claimedScore),
            maxScore: Number(si.maxScore),
            description: si.description ?? "",
            evidence: si.evidence ?? "",
          })),
        }
      );
      toast({ title: "Saved", description: "Subsection saved successfully" });
      fetchSubmissions();
    } catch {
      toast({ title: "Save failed", description: "Check backend", variant: "destructive" });
    }
  };

  if (loading) return <p>Loading...</p>;

  const totalMax = subCriteria.reduce((s, sc) => s + Number(sc.maxPoints), 0);
  const totalClaimed = subCriteria.reduce(
    (s, sc) => s + sc.subItems.reduce((x: number, si: any) => x + Number(si.finalScore || 0), 0),
    0
  );

  /* ---------------- RENDER ---------------- */
  return (
    <DashboardLayout title="Institutional Development" subtitle="Criterion 5 • Maximum 45 Points">
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex justify-between mb-2">
              <span>Overall Progress</span>
              <span>{totalClaimed} / {totalMax}</span>
            </div>
            <Progress value={(totalClaimed / totalMax) * 100} className="h-3" />
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          {subCriteria.map((sub) => (
            <AccordionItem key={sub.id} value={sub.id} className="border rounded-lg">
              <AccordionTrigger className="flex justify-between items-center px-4">
                <span>{sub.id} - {sub.title}</span>
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
                    <CardHeader className="flex justify-between items-center">
                      <CardTitle>{si.name}</CardTitle>
                      {si.isVerified && <Badge className="bg-blue-800 text-white">Verified</Badge>}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div>
                        <label>Final Score (Max {si.maxScore})</label>
                        <input
                          type="number"
                          value={si.finalScore}
                          disabled
                          className="w-full border rounded p-2 bg-gray-100"
                        />
                      </div>

                      {si.hodScore != null && (
                        <p className="text-sm text-blue-700">
                          HOD Score: {si.hodScore} | HOD Notes: {si.hodDescription}
                        </p>
                      )}

                      {si.committeeScore != null && (
                        <p className="text-sm text-purple-700 font-medium">
                          Committee Score: {si.committeeScore} | Committee Remarks: {si.committeeRemarks}
                        </p>
                      )}

                      <div>
                        <label>Description</label>
                        <textarea
                          value={si.description}
                          disabled={si.hodScore != null || si.committeeScore != null}
                          onChange={(e) => updateSubItem(sub.id, i, "description", e.target.value)}
                          className="w-full border rounded p-2"
                        />
                      </div>

                      <div>
                        <label>Evidence URL</label>
                        <input
                          type="text"
                          value={si.evidence}
                          disabled={si.hodScore != null || si.committeeScore != null}
                          onChange={(e) => updateSubItem(sub.id, i, "evidence", e.target.value)}
                          className="w-full border rounded p-2"
                        />
                      </div>

                      {!si.isVerified && si.hodScore == null && si.committeeScore == null && (
                        <Button onClick={() => saveSingleCriterion(sub.id, si)}>
                          Save This Criterion
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {sub.subItems.every((si) => si.hodScore == null && si.committeeScore == null) && (
                  <Button onClick={() => saveSubsection(sub)}>Save Entire Subsection</Button>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}