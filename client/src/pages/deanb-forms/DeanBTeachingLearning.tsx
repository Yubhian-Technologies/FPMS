import { useEffect, useState } from "react";
import { api } from "@/api/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";

const MODULE1_STRUCTURE = {
  A1: {
    title: "Academic Planning & Execution",
    maxPoints: 8,
    criteria: {
      a: {
        label:
          "Comprehensive institution-level academic plans with ≥90% execution adherence",
        maxScore: 5,
      },
      b: {
        label:
          "Documented ATRs, academic review minutes, and corrective action evidence",
        maxScore: 3,
      },
    },
  },

  A2: {
    title: "OBE Governance & Attainment Monitoring",
    maxPoints: 8,
    criteria: {
      a: {
        label:
          "Institution-wide OBE framework, CO–PO–PSO mapping completeness, and consolidated attainment dashboards",
        maxScore: 5,
      },
      b: {
        label:
          "Documented corrective actions and improvement cycles based on attainment analysis",
        maxScore: 3,
      },
    },
  },

  A3: {
    title: "Curriculum Enrichment & BoS Leadership",
    maxPoints: 7,
    criteria: {
      a: {
        label:
          "Structured BoS proposals and adoption of curriculum enrichment initiatives",
        maxScore: 4,
      },
      b: {
        label:
          "Evidence of industry benchmarking, interdisciplinary innovation, and strategic academic inputs",
        maxScore: 3,
      },
    },
  },

  A4: {
    title: "Academic Risk Identification & Mitigation",
    maxPoints: 7,
    criteria: {
      a: {
        label:
          "Early identification of academic risks with documented mitigation plans",
        maxScore: 4,
      },
      b: {
        label:
          "Measurable outcome improvement supported by before–after evidence",
        maxScore: 3,
      },
    },
  },
};

type Criterion = {
  name: string;
  claimedScore: number;
  deanDescription?: string;
  evidence?: string;
  adminScore?: number | null;
  adminDescription?: string;
  isVerified?: boolean;
  maxScore: number;
};

type Subsection = {
  id: string;
  criteria: Criterion[];
};

export default function DeanTeachingLearning() {
  const { user, isLoading } = useAuth();
  const deanId = user?.id;

  const [subsections, setSubsections] = useState<Record<string, Subsection>>({});
  const [form, setForm] = useState<Record<string, any>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});

  /* ================= FETCH ================= */
  const fetchData = async () => {
    if (!deanId) return;

    try {
      const res = await api.get(`/api/dean/partb/module1/${deanId}`);

      const list = res.data?.data || [];
      const mapped: Record<string, Subsection> = {};

      list.forEach((s: any) => {
        mapped[s.id] = {
          id: s.id,
          criteria: s.criteria || [],
        };
      });

      setSubsections(mapped);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    if (!isLoading && deanId) fetchData();
  }, [isLoading, deanId]);

  /* ================= SCORE HELPERS ================= */

  const getFinalScore = (c?: Criterion) => {
    if (!c) return 0;
    return c.adminScore ?? c.claimedScore ?? 0;
  };

  const getSubsectionScore = (subId: string) => {
    const sub = subsections[subId];
    if (!sub) return 0;
    return sub.criteria.reduce((sum, c) => sum + getFinalScore(c), 0);
  };

  const totalMax = Object.values(MODULE1_STRUCTURE).reduce(
    (s, m) => s + m.maxPoints,
    0
  );

  const totalCurrent = Object.keys(MODULE1_STRUCTURE).reduce(
    (s, id) => s + getSubsectionScore(id),
    0
  );

  /* ================= SUBMIT ================= */

  const submitCriterion = async (subId: string, key: string) => {
    const formKey = `${subId}.${key}`;
    const payload = form[formKey];
    if (!payload || !deanId) return;

    try {
      await api.post(
        `/api/dean/partb/module1/${deanId}/subsection/${subId}`,
        {
          criteria: [
            {
              name: key,
              claimedScore: Number(payload.claimedScore || 0),
              maxScore:
                MODULE1_STRUCTURE[subId as keyof typeof MODULE1_STRUCTURE]
                  .criteria[key].maxScore,
              description: payload.deanDescription || "",
              evidence: payload.evidence || "",
            },
          ],
        }
      );

      setEditMode((p) => ({ ...p, [formKey]: false }));
      fetchData();
    } catch (err) {
      console.error("Submit failed", err);
    }
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout title="Teaching & Learning" subtitle="Module 1">
      <div className="space-y-6">

        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Module 1</h1>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Progress value={(totalCurrent / totalMax) * 100} />
            <p className="text-sm mt-2">
              Final Score: <b>{totalCurrent}</b> / {totalMax}
            </p>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible>
          {Object.entries(MODULE1_STRUCTURE).map(([subId, sub]) => (
            <AccordionItem key={subId} value={subId}>
              <AccordionTrigger>
                <div className="flex justify-between w-full pr-4">
                  <span>
                    {subId} – {sub.title}
                  </span>
                  <Badge variant="outline">
                    {getSubsectionScore(subId)} / {sub.maxPoints}
                  </Badge>
                </div>
              </AccordionTrigger>

              <AccordionContent className="space-y-4">
                {Object.entries(sub.criteria).map(([key, def]) => {
                  const existing = subsections[subId]?.criteria?.find(
                    (c) => c.name === key
                  );

                  const formKey = `${subId}.${key}`;
                  const editing = editMode[formKey];

                  /* ================= EDIT MODE ================= */

                  if (!existing || editing) {
                    return (
                      <Card key={formKey}>
                        <CardHeader>
                          <CardTitle>
                            {subId}.{key} – {def.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">

                          <input
                            type="number"
                            min={0}
                            max={def.maxScore}
                            value={
                              form[formKey]?.claimedScore ??
                              existing?.claimedScore ??
                              ""
                            }
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [formKey]: {
                                  ...p[formKey],
                                  claimedScore: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full border rounded px-3 py-2"
                          />

                          <textarea
                            placeholder="Description"
                            value={
                              form[formKey]?.deanDescription ??
                              existing?.deanDescription ??
                              ""
                            }
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [formKey]: {
                                  ...p[formKey],
                                  deanDescription: e.target.value,
                                },
                              }))
                            }
                            className="w-full border rounded px-3 py-2"
                          />

                          <textarea
                            placeholder="Evidence"
                            value={
                              form[formKey]?.evidence ??
                              existing?.evidence ??
                              ""
                            }
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [formKey]: {
                                  ...p[formKey],
                                  evidence: e.target.value,
                                },
                              }))
                            }
                            className="w-full border rounded px-3 py-2"
                          />

                          <Button
                            size="sm"
                            onClick={() => submitCriterion(subId, key)}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }

                  /* ================= VIEW MODE ================= */

                  return (
                    <Card key={formKey}>
                      <CardHeader>
                        <CardTitle className="flex justify-between">
                          <span>
                            {subId}.{key} – {def.label}
                          </span>
                          {!existing.isVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditMode((p) => ({
                                  ...p,
                                  [formKey]: true,
                                }))
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">

                        <p>
                          <b>Claimed:</b> {existing.claimedScore} / {def.maxScore}
                        </p>

                        {existing.deanDescription && (
                          <p>
                            <b>Description:</b> {existing.deanDescription}
                          </p>
                        )}

                        {existing.evidence && (
                          <p>
                            <b>Evidence:</b> {existing.evidence}
                          </p>
                        )}

                        {existing.adminScore !== null && (
                          <p>
                            <b>Admin Score:</b> {existing.adminScore}
                          </p>
                        )}

                        <p className="font-semibold border-t pt-2">
                          Final: {getFinalScore(existing)} / {def.maxScore}
                        </p>

                      </CardContent>
                    </Card>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}