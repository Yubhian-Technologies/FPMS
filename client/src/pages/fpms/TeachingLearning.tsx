import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SubSubCriteria {
  name: string;
  claimedScore: number;
  maxScore: number;
  evidence: string;
  description: string;
  hodScore?: number;
  hodDescription?: string;
  isVerified?: boolean;
}

interface SubCriteria {
  id: string;
  title: string;
  maxPoints: number;
  subItems: SubSubCriteria[];
  status: "not-started" | "in-progress" | "completed";
}

export default function TeachingLearning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subCriteria, setSubCriteria] = useState<SubCriteria[]>([]);

 const defaultSubCriteria: SubCriteria[] = [
    {
      id: "1.1",
      title: "Curriculum Development",
      maxPoints: 8,
      subItems: [
        { name: "Course/Lab Design", claimedScore: 0, maxScore: 3, evidence: "", description: "" },
        { name: "Digital Content Creation", claimedScore: 0, maxScore: 3, evidence: "", description: "" },
        { name: "CO–PO–PSO Mapping", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
      ],
      status:'not-started'
    },
    {
      id: "1.2",
      title: "Teaching Load & Active Learning",
      maxPoints: 15,
      subItems: [
        { name: "Active Learning Strategies", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "Discovery-based Lab Experiments", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "Self-Assessment Report", claimedScore: 0, maxScore: 3, evidence: "", description: "" },
        { name: "Case Studies / Real-life Examples", claimedScore: 0, maxScore: 3, evidence: "", description: "" },
        { name: "SDG-related Complex Problem Integration", claimedScore: 0, maxScore: 3, evidence: "", description: "" },
        { name: "Support for Slow Learners", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
      ],
      status:'not-started'
    },
    {
      id: "1.3",
      title: "OBE Adaptation & Implementation",
      maxPoints: 6,
      subItems: [
        { name: "TLA Report with Outcome Attainment", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "Rubric-based Assessment", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "CO Attainment Calculation", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
      ],
      status:'not-started'
    },
    {
      id: "1.4",
      title: "Innovative Pedagogy & Assessment",
      maxPoints: 10,
      subItems: [
        { name: "LMS and Analytics Usage", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "Flipped Classroom", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "Experiential Learning / Industry Cases", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "SWAYAM / NPTEL Facilitation", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
        { name: "Mini / Micro Projects with PO–PSO Alignment", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
      ],
      status:'not-started'
    },
    {
      id: "1.5",
      title: "Technology-Enhanced Learning",
      maxPoints: 5,
      subItems: [
        { name: "Digital/Video Content Portfolio", claimedScore: 0, maxScore: 3, evidence: "", description: "" },
        { name: "Implementation Report (LMS/Classroom Usage)", claimedScore: 0, maxScore: 2, evidence: "", description: "" },
      ],
      status:'not-started'
    },
    {
      id: "1.6",
      title: "Student Feedback",
      maxPoints: 8,
      subItems: [
        { name: "Excellent Feedback ≥85%", claimedScore: 0, maxScore: 4, evidence: "", description: "" },
        { name: "Good Feedback 75–84.9%", claimedScore: 0, maxScore: 4, evidence: "", description: "" },
      ],
      status:'not-started'
    },
    {
      id: "1.7",
      title: "Academic Results",
      maxPoints: 10,
      subItems: [
        { name: "≥60% Students scoring >60%", claimedScore: 0, maxScore: 5, evidence: "", description: "" },
        { name: "50–59.9% Students scoring >60%", claimedScore: 0, maxScore: 5, evidence: "", description: "" },
      ],
      status:'not-started'
    },
    {
      id: "1.8",
      title: "Quality Course File",
      maxPoints: 8,
      subItems: [
        { name: "Course Planning & CO–PO Mapping", claimedScore: 0, maxScore: 1, evidence: "", description: "" },
        { name: "Course Articulation Matrix", claimedScore: 0, maxScore: 1, evidence: "", description: "" },
        { name: "Quality of Instructional Resources", claimedScore: 0, maxScore: 1, evidence: "", description: "" },
        { name: "Assessment Plans & Bloom's-tagged Question Banks", claimedScore: 0, maxScore: 1, evidence: "", description: "" },
        { name: "Repeat for Second Semester", claimedScore: 0, maxScore: 4, evidence: "", description: "" },
      ],
      status:'not-started'
    },
  ];

  const fetchFacultySubmissions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/module1/faculty/${user.id}`);
      const backendData = res.data?.data || [];

      const merged = defaultSubCriteria.map((sc) => {
  const existing = backendData.find((b: any) => b.id === sc.id);
  return {
    ...sc,
    subItems: sc.subItems.map((si) => {
      const existingItem = existing?.criteria?.find((c: any) => c.name === si.name);
      return existingItem
        ? {
            ...si,
            claimedScore: existingItem.claimedScore ?? si.claimedScore,
            evidence: existingItem.evidence ?? "",
            description:
  existingItem.facultyDescription !== undefined && existingItem.facultyDescription !== null
    ? existingItem.facultyDescription
    : si.description ?? "",

            hodScore: existingItem.hodScore ?? undefined,
            hodDescription: existingItem.hodDescription ?? "",
            isVerified: existingItem.isVerified ?? false,
          }
        : si;
    }),
    status: existing ? "in-progress" : "not-started",
  };
});


      setSubCriteria(merged);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultySubmissions();
  }, [user]);

  const updateSubItem = (subId: string, index: number, field: keyof SubSubCriteria, value: string | number) => {
    setSubCriteria((prev) =>
      prev.map((sc) =>
        sc.id !== subId
          ? sc
          : {
              ...sc,
              subItems: sc.subItems.map((si, i) => (i === index && !si.isVerified ? { ...si, [field]: value } : si)),
              status: "in-progress",
            }
      )
    );
  };

  const saveSingleCriterion = async (subId: string, criterion: SubSubCriteria) => {
    if (!user) return;
    try {
      await api.post(`/api/module1/faculty/${user.id}/subsection/${subId}`, {
        criteria: [criterion],
      });
      toast({ title: "Saved", description: `${criterion.name} saved successfully` });
    } catch {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  };

  const saveSubsection = async (sub: SubCriteria) => {
    if (!user) return;
    try {
      await api.post(`/api/module1/faculty/${user.id}/subsection/${sub.id}`, {
        criteria: sub.subItems,
      });
      toast({ title: "Saved", description: `Subsection ${sub.id} saved` });
    } catch {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  };

  if (loading) return <p>Loading...</p>;

  const totalMax = subCriteria.reduce((sum, sc) => sum + sc.maxPoints, 0);
  const totalSubmitted = subCriteria.reduce(
    (sum, sc) => sum + sc.subItems.reduce((s, si) => s + (!si.isVerified ? si.claimedScore : 0), 0),
    0
  );
  const totalVerified = subCriteria.reduce(
    (sum, sc) => sum + sc.subItems.reduce((s, si) => s + (si.isVerified ? si.hodScore ?? 0 : 0), 0),
    0
  );
  const totalNotStarted = totalMax - totalSubmitted - totalVerified;

  return (
    <DashboardLayout title="Teaching & Learning" subtitle="Criterion 1 • Maximum 70 Points">
      <div className="space-y-6">
        
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 rounded-full">
            <div className="relative group w-full h-4 rounded-full  flex">
              <div
                className="bg-primary h-4"
                style={{ width: `${(totalVerified / totalMax) * 100}%` }}
              />
              <div
                className="bg-primary h-4"
                style={{ width: `${(totalSubmitted / totalMax) * 100}%` }}
              />
              <div
                className="bg-secondary h-4 flex-1"
              />
              {/* Tooltip on hover */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block bg-black text-white text-xs rounded px-3 py-2 z-50 shadow-lg">
                <div>Submitted: {totalSubmitted} / {totalMax}</div>
                <div>Verified: {totalVerified} / {totalMax}</div>
                <div>Not Started: {totalNotStarted} / {totalMax}</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span>{totalSubmitted + totalVerified} / {totalMax} Points</span>
              <span>{Math.round(((totalSubmitted + totalVerified) / totalMax) * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          {subCriteria.map((sc) => (
            <AccordionItem key={sc.id} value={sc.id} className="border rounded-lg ">
              <AccordionTrigger className="px-4 flex justify-between items-center relative">
                <div className="flex gap-2 items-center">
                  <Badge>{sc.id}</Badge>
                  <span className="font-semibold">{sc.title}</span>
                </div>
                <div className="absolute right-2 top-2">
                  {sc.subItems.every(si => si.isVerified) ? (
                    <Badge className="bg-blue-800 text-white">Verified</Badge>
                  ) : sc.subItems.some(si => si.claimedScore > 0) ? (
                    <Badge variant="secondary">Completed</Badge>
                  ) : (
                    <Badge variant="destructive">Not Started</Badge>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="space-y-4 px-4 pb-4">
                {sc.subItems.map((si, i) => (
                  <Card key={i}>
                    <CardHeader className="flex justify-between items-center">
                      <CardTitle>{si.name}</CardTitle>
                      {si.isVerified && <Badge className="bg-blue-800 text-white">Verified</Badge>}
                      {!si.isVerified && si.claimedScore > 0 && <Badge variant="secondary">Submitted</Badge>}
                      {si.claimedScore === 0 && !si.isVerified && <Badge variant="destructive">Not Started</Badge>}
                    </CardHeader>

                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm">
                          Faculty Score <span className="text-muted-foreground">(Max {si.maxScore})</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={si.maxScore}
                          className="w-full border rounded p-2"
                          value={si.claimedScore}
                          disabled={si.isVerified}
                          onChange={e =>
                            updateSubItem(sc.id, i, "claimedScore", Number(e.target.value))
                          }
                        />
                      </div>

                      {si.isVerified && (
                        <div>
                          <label className="text-sm">HOD Score</label>
                          <input
                            type="number"
                            className="w-full border rounded p-2 bg-green-50"
                            value={si.hodScore ?? 0}
                            disabled
                          />
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <label className="text-sm">Evidence URL</label>
                        <input
                          type="text"
                          className="w-full border rounded p-2"
                          value={si.evidence}
                          disabled={si.isVerified}
                          onChange={e => updateSubItem(sc.id, i, "evidence", e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm">Faculty Description</label>
                        <textarea
                          className="w-full border rounded p-2 min-h-[80px]"
                          value={si.description}
                          disabled={si.isVerified}
                          onChange={e =>
                            updateSubItem(sc.id, i, "description", e.target.value)
                          }
                          placeholder="Explain how this criterion is satisfied..."
                        />
                      </div>

                      {si.isVerified && (
                        <div className="md:col-span-2">
                          <label className="text-sm">HOD Description</label>
                          <textarea
                            className="w-full border rounded p-2 min-h-[80px] bg-green-50"
                            value={si.hodDescription ?? ""}
                            disabled
                          />
                        </div>
                      )}

                      {!si.isVerified && (
                        <div className="md:col-span-2">
                          <Button
                            onClick={() => saveSingleCriterion(sc.id, si)}
                            className="mt-2"
                          >
                            Save This Criterion
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={() => saveSubsection(sc)}>Save Sub-Criterion</Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
