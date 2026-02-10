import { useEffect, useState } from "react";
import { api } from "@/api/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/* ---------- STRUCTURE ---------- */
const MODULE1_STRUCTURE = {
  "1.1": {
    title: "Curriculum Development (Beyond Curriculum)",
    maxPoints: 8,
    criteria: {
      a: { label: "New course / module development", maxScore: 3 },
      b: { label: "Digital content creation", maxScore: 3 },
      c: { label: "CO–PO–PSO mapping", maxScore: 2 }
    }
  },
  "1.2": {
    title: "Teaching Load & Active Learning Pedagogy",
    maxPoints: 10,
    criteria: {
      a: { label: "LMS usage", maxScore: 2 },
      b: { label: "Flipped classroom", maxScore: 2 },
      c: { label: "Experiential learning", maxScore: 2 },
      d: { label: "NPTEL facilitation", maxScore: 2 },
      e: { label: "Mini projects", maxScore: 2 }
    }
  },
  "1.3": {
    title: "Student Feedback & Improvement",
    maxPoints: 8,
    criteria: {
      a: { label: "Structured student feedback analysis", maxScore: 3 },
      b: { label: "Corrective actions implemented", maxScore: 3 },
      c: { label: "Outcome-based improvement measures", maxScore: 2 }
    }
  },
  "1.4": {
    title: "Student Academic Results",
    maxPoints: 10,
    criteria: {
      a: { label: "Pass percentage analysis", maxScore: 3 },
      b: { label: "University rank / distinction holders", maxScore: 3 },
      c: { label: "Result comparison with previous years", maxScore: 2 },
      d: { label: "Remedial measures for weak students", maxScore: 2 }
    }
  }
};

/* ---------- TYPES ---------- */
type CriteriaItem = {
  claimedScore: number;
  maxScore: number;
  description?: string;
  evidence?: string;
  isVerified?: boolean;
};

type SubsectionData = {
  id: string;
  name: string;
  criteria: Record<string, CriteriaItem>;
};

type ModuleData = Record<string, SubsectionData>;

export default function TeachingandLearning() {
  const [data, setData] = useState<ModuleData>({});
  const [form, setForm] = useState<Record<string, Partial<CriteriaItem>>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});

  /* ---------- FETCH DATA ---------- */
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token"); // ✅ HOD token from login
      const res = await api.get("/api/hod/parta/hod-module1", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(res.data.data || {});
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- HELPERS ---------- */
  const getClaimedScore = (subId: string) => {
    const criteria = data?.[subId]?.criteria || {};
    return Object.values(criteria).reduce((sum, c) => sum + Number(c.claimedScore || 0), 0);
  };

  const totalMax = Object.values(MODULE1_STRUCTURE).reduce((s, m) => s + m.maxPoints, 0);
  const totalCurrent = Object.keys(MODULE1_STRUCTURE).reduce((s, id) => s + getClaimedScore(id), 0);

  /* ---------- SUBMIT ---------- */
  const submitCriteria = async (subId: string, key: string) => {
    try {
      const token = localStorage.getItem("token");
      const formKey = `${subId}.${key}`;
      const payload = form[formKey];

      await api.post(
        `/api/hod/parta/hod-module1/${subId}/${key}`,
        {
          ...payload,
          maxScore: MODULE1_STRUCTURE[subId].criteria[key].maxScore,
          subsectionName: MODULE1_STRUCTURE[subId].title
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditMode({ ...editMode, [formKey]: false });
      fetchData();
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  /* ---------- UI ---------- */
  return (
    <DashboardLayout title="Teaching & Learning" subtitle="Module 1">
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Module 1</h1>
        </div>

        {/* PROGRESS */}
        <Card>
          <CardContent className="pt-4">
            <Progress value={(totalCurrent / totalMax) * 100} />
            <p className="text-sm mt-2">{totalCurrent} / {totalMax} points</p>
          </CardContent>
        </Card>

        {/* ACCORDION */}
        <Accordion type="single" collapsible>
          {Object.entries(MODULE1_STRUCTURE).map(([subId, sub]) => (
            <AccordionItem key={subId} value={subId}>
              <AccordionTrigger>
                <div className="flex justify-between w-full">
                  <span>{subId} – {sub.title}</span>
                  <Badge>{getClaimedScore(subId)} / {sub.maxPoints}</Badge>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                {Object.entries(sub.criteria).map(([key, c]) => {
                  const dbVal = data?.[subId]?.criteria?.[key] as CriteriaItem | undefined;
                  const formKey = `${subId}.${key}`;
                  const isEditing = editMode[formKey] || !dbVal;
                  const claimed = form[formKey]?.claimedScore ?? dbVal?.claimedScore ?? 0;

                  /* ---------- READ-ONLY ---------- */
                  if (!isEditing && dbVal) {
                    return (
                      <Card key={formKey} className="mb-4">
                        <CardHeader>
                          <CardTitle className="text-sm">{subId}.{key} – {c.label}</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-2 text-sm">
                          <p><b>Claimed Score:</b> {dbVal.claimedScore}</p>
                          <p><b>Description:</b> {dbVal.description}</p>
                          <p><b>Evidence:</b> {dbVal.evidence}</p>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setForm({
                                ...form,
                                [formKey]: {
                                  claimedScore: dbVal.claimedScore,
                                  description: dbVal.description,
                                  evidence: dbVal.evidence
                                }
                              });
                              setEditMode({ ...editMode, [formKey]: true });
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Update
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }

                  /* ---------- EDIT ---------- */
                  return (
                    <Card key={formKey} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-sm">{subId}.{key} – {c.label}</CardTitle>
                        <p className="text-xs text-muted-foreground">Max Score: {c.maxScore}</p>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <input
                          type="number"
                          min={0}
                          max={c.maxScore}
                          value={claimed}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [formKey]: {
                                ...form[formKey],
                                claimedScore: Math.min(Math.max(0, Number(e.target.value)), c.maxScore)
                              }
                            })
                          }
                          className="w-full border p-2 rounded"
                        />

                        <textarea
                          placeholder="Description"
                          value={form[formKey]?.description ?? dbVal?.description ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, [formKey]: { ...form[formKey], description: e.target.value } })
                          }
                          className="w-full border p-2 rounded"
                        />

                        <textarea
                          placeholder="Evidence"
                          value={form[formKey]?.evidence ?? dbVal?.evidence ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, [formKey]: { ...form[formKey], evidence: e.target.value } })
                          }
                          className="w-full border p-2 rounded"
                        />

                        <Button size="sm" onClick={() => submitCriteria(subId, key)}>
                          <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
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