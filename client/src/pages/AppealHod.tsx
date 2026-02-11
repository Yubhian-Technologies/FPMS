import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/api/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SubSubCriteria {
  name: string;
  claimedScore: number;
  facultyDescription: string;
  hodScore?: number;
  hodDescription?: string;
  adminScore?: number;
  adminDescription?: string;
  isVerified?: boolean;
}

interface Subsection {
  id: string;
  criteria: SubSubCriteria[];
}

interface Appeal {
  id: string;
  module: string;
  subId: string;
  criterionName: string;
  requestedScore: number;
  hodReason: string;
  evidence: string;
  status: string;
  createdAt: string;
}

interface AppealFormData {
  module: string;
  subId: string;
  criterionName: string;
  requestedScore: number;
  appealReason: string;
  evidence: string;
}

const AppealHod = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [criteriaOptions, setCriteriaOptions] = useState<SubSubCriteria[]>([]);
  const [formData, setFormData] = useState<AppealFormData>({
    module: "",
    subId: "",
    criterionName: "",
    requestedScore: 0,
    appealReason: "",
    evidence: "",
  });
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [expandedAppealIds, setExpandedAppealIds] = useState<string[]>([]);

  useEffect(() => {
  if (!user?.id) return;

  const fetchAppeals = async () => {
    try {
      const res = await api.get(`/api/hod/appeals/partab`);
      console.log("Appeals GET response:", res.data);  // <-- check structure
      const dataArray = res.data?.data
        ? res.data.data
        : res.data // fallback if your backend returns raw object
      setAppeals(Array.isArray(dataArray) ? dataArray : Object.values(dataArray));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch appeals");
    }
  };

  fetchAppeals();
}, [user]);

  // Update criteria options when subsection changes
  useEffect(() => {
    if (!formData.subId) {
      setCriteriaOptions([]);
      setFormData(prev => ({ ...prev, criterionName: "", requestedScore: 0, evidence: "" }));
      return;
    }
    const sub = subsections.find(s => s.id === formData.subId);
    if (sub) setCriteriaOptions(sub.criteria || []);
  }, [formData.subId, subsections]);

  // Update requestedScore and evidence when criterion changes
  useEffect(() => {
    if (!formData.criterionName) return;
    const crit = criteriaOptions.find(c => c.name === formData.criterionName);
    if (crit) {
      setFormData(prev => ({
        ...prev,
        requestedScore: crit.hodScore ?? crit.claimedScore ?? 0,
        evidence: crit.hodDescription ?? "",
      }));
    }
  }, [formData.criterionName, criteriaOptions]);

  // Fetch all HOD appeals
  useEffect(() => {
    if (!user?.id) return;

    const fetchAppeals = async () => {
      try {
        const res = await api.get(`/api/hod/appeals/partab`);
        setAppeals(res.data?.data || []);
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to fetch appeals");
      }
    };

    fetchAppeals();
  }, [user]);

  const handleInputChange = (field: keyof AppealFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitAppeal = async () => {
    const { module, subId, criterionName, requestedScore, appealReason, evidence } = formData;

    if (!module || !subId || !criterionName || !requestedScore || !appealReason) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await api.post(
        `/api/hod/appeals/modules/${module}/sub/${subId}/criteria/${encodeURIComponent(criterionName)}/appeal`,
        { requestedScore, hodReason: appealReason, evidence }
      );

      toast.success("Appeal submitted successfully");
      setIsDialogOpen(false);
      setFormData({ module: "", subId: "", criterionName: "", requestedScore: 0, appealReason: "", evidence: "" });
      setSubsections([]);
      setCriteriaOptions([]);

      const res = await api.get(`/api/hod/appeals`);
      setAppeals(res.data?.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit appeal");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAppealIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout title="HOD Appeals" subtitle="Submit and view your appeals">
      <div className="space-y-6 text-sm">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>New Appeal</Button>
        </div>

        {/* New Appeal Form */}
        {isDialogOpen && (
          <Card className="p-4 space-y-3 shadow-sm rounded-lg">
            <CardHeader><CardTitle className="text-base font-medium">Submit New HOD Appeal</CardTitle></CardHeader>
            <CardContent className="grid gap-3">

              {/* Module select */}
              <div className="grid gap-1">
                <Label className="text-xs">Module</Label>
                <Select value={formData.module} onValueChange={v => handleInputChange("module", v)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select Module" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="module1">Module 1</SelectItem>
                    <SelectItem value="module5">Module 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subsection select */}
              <div className="grid gap-1">
                <Label className="text-xs">Subsection</Label>
                <Select value={formData.subId} onValueChange={v => handleInputChange("subId", v)} disabled={!subsections.length}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select Subsection" /></SelectTrigger>
                  <SelectContent>
                    {subsections.map(sub => <SelectItem key={sub.id} value={sub.id}>{sub.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Criterion select */}
              <div className="grid gap-1">
                <Label className="text-xs">Criterion</Label>
                <Select value={formData.criterionName} onValueChange={v => handleInputChange("criterionName", v)} disabled={!criteriaOptions.length}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select Criterion" /></SelectTrigger>
                  <SelectContent>
                    {criteriaOptions.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Requested Score */}
              <div className="grid gap-1">
                <Label className="text-xs">Requested Score</Label>
                <Textarea type="number" value={formData.requestedScore} onChange={e => handleInputChange("requestedScore", Number(e.target.value))} className="text-sm h-8" />
              </div>

              {/* Evidence */}
              <div className="grid gap-1">
                <Label className="text-xs">Evidence / Description</Label>
                <Textarea value={formData.evidence} onChange={e => handleInputChange("evidence", e.target.value)} className="text-sm h-16" />
              </div>

              {/* Appeal Reason */}
              <div className="grid gap-1">
                <Label className="text-xs">Appeal Reason</Label>
                <Textarea value={formData.appealReason} onChange={e => handleInputChange("appealReason", e.target.value)} className="text-sm h-16" />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSubmitAppeal}>Submit</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HOD Appeals List */}
        {appeals.map(a => {
          const isExpanded = expandedAppealIds.includes(a.id);
          let statusColor = "text-gray-600";
          if (a.status === "pending") statusColor = "text-yellow-600";
          if (a.status === "committee_verified") statusColor = "text-green-600";
          if (a.status === "rejected") statusColor = "text-red-600";

          return (
            <Card key={a.id} className="shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row justify-between items-center p-4 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800">{a.module} - {a.subId} - {a.criterionName}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => toggleExpand(a.id)} className="text-sm">
                  {isExpanded ? "Hide Details" : "View Details"}
                </Button>
              </CardHeader>
              {isExpanded && (
                <CardContent className="p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Requested Score:</strong> {a.requestedScore}</div>
                    <div><strong>Status:</strong> <span className={statusColor}>{a.status}</span></div>
                    <div className="md:col-span-2"><strong>Reason:</strong> {a.hodReason}</div>
                    <div className="md:col-span-2"><strong>Evidence:</strong> {a.evidence}</div>
                    <div className="md:col-span-2"><strong>Submitted On:</strong> {new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default AppealHod;