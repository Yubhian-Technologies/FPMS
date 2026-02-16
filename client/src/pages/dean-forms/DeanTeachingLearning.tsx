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
  "1.1": {
    title: "Curriculum Development (Beyond Curriculum / Value Added)",
    maxPoints: 8,
    criteria: {
      a: {
        label:
          "New course / module development (≥20% industry-aligned content change)",
        maxScore: 3,
      },
      b: {
        label:
          "Digital content creation (videos, LMS material, e-content)",
        maxScore: 3,
      },
      c: {
        label:
          "Systematic CO–PO–PSO mapping with documented academic rationale",
        maxScore: 2,
      },
    },
  },

  "1.2": {
    title: "Teaching Load & Active Learning Pedagogy",
    maxPoints: 10,
    criteria: {
      a: {
        label: "Use of LMS and learning analytics tools (per semester)",
        maxScore: 2,
      },
      b: {
        label: "Flipped classroom implementation (per semester)",
        maxScore: 2,
      },
      c: {
        label:
          "Experiential learning using case studies / industry use-cases (per semester)",
        maxScore: 2,
      },
      d: {
        label:
          "Facilitating SWAYAM / NPTEL course completion (≥10 students) (per semester)",
        maxScore: 2,
      },
      e: {
        label:
          "Mini / micro projects with PO–PSO alignment (per semester)",
        maxScore: 2,
      },
    },
  },

  "1.3": {
    title: "Student Feedback (Best Theory Subject per Semester)",
    maxPoints: 8,
    criteria: {
      sem1: {
        label:
          "Semester 1 – Best subject feedback (≥75% attendance considered)",
        maxScore: 4,
      },
      sem2: {
        label:
          "Semester 2 – Best subject feedback (≥75% attendance considered)",
        maxScore: 4,
      },
    },
  },

  "1.4": {
    title: "Academic Results of Students (Best Theory Subject per Semester)",
    maxPoints: 10,
    criteria: {
      sem1: {
        label:
          "Semester 1 – % students scoring >60% (best subject)",
        maxScore: 5,
      },
      sem2: {
        label:
          "Semester 2 – % students scoring >60% (best subject)",
        maxScore: 5,
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
      const res = await api.get(`/api/dean/parta/module1/${deanId}`);

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
        `/api/dean/parta/module1/${deanId}/subsection/${subId}`,
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