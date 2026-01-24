import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/api';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Appeal {
  id: string;
  facultyName?: string;
  module: string;
  subId: string;
  criterionName: string;
  claimedScore: number;
  facultyDescription: string;
  hodScore: number;
  hodDescription: string;
  requestedScore: number;
  appealReason: string;
  evidence: string;
  status: string;
  verifiedByCommittee?: boolean;
  committeeScore?: number;
  committeeRemarks?: string;
  createdAt: string;
}

export default function CommitteeAppeals() {
  const { user } = useAuth();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [committeeInputs, setCommitteeInputs] = useState<{ [key: string]: { score: number; remarks: string } }>({});

  // Fetch appeals
  useEffect(() => {
    if (!user) return;
    fetchAppeals();
  }, [user]);

  const fetchAppeals = async () => {
    try {
      const res = await api.get('/api/committee/appeals');
      setAppeals(res.data.data);

      // Initialize input fields for committee scores
      const initialInputs: any = {};
      res.data.data.forEach((a: Appeal) => {
        initialInputs[a.id] = {
          score: a.committeeScore ?? 0,
          remarks: a.committeeRemarks ?? '',
        };
      });
      setCommitteeInputs(initialInputs);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to fetch appeals');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleInputChange = (id: string, field: 'score' | 'remarks', value: any) => {
    setCommitteeInputs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const submitCommitteeScore = async (appeal: Appeal) => {
    const input = committeeInputs[appeal.id];
    if (!input || input.score === undefined) {
      toast.error('Score is required');
      return;
    }

    try {
      await api.put(`/api/committee/appeals/${appeal.id}`, {
        committeeScore: input.score,
        committeeRemarks: input.remarks || '',
      });

      // Update UI immediately
      setAppeals(prev =>
        prev.map(a =>
          a.id === appeal.id
            ? { ...a, verifiedByCommittee: true, committeeScore: input.score, committeeRemarks: input.remarks, status: 'committee_verified' }
            : a
        )
      );

      toast.success('Appeal verified successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to verify appeal');
    }
  };

  return (
    <DashboardLayout title="Committee Appeals">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Pending Appeals</h2>
        {appeals.filter(appeal => !(appeal.verifiedByCommittee ?? false)).length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No appeals available for verification.</p>
        ) : (
          appeals.filter(appeal => !(appeal.verifiedByCommittee ?? false)).map(appeal => {
            const isExpanded = expandedIds.includes(appeal.id);
            const input = committeeInputs[appeal.id] || { score: appeal.committeeScore ?? 0, remarks: appeal.committeeRemarks ?? '' };
            const verified = appeal.verifiedByCommittee ?? false;

            return (
              <Card key={appeal.id} className="shadow-sm rounded-md">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>
                    {appeal.module} - {appeal.subId} - {appeal.criterionName}
                  </CardTitle>
                  {/* <StatusBadge status={verified ? 'verified' : 'pending'} /> */}
                  <Button size="sm" variant="outline" onClick={() => toggleExpand(appeal.id)}>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </Button>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Faculty Score:</strong> {appeal.claimedScore}</div>
                    <div><strong>Faculty Description:</strong> {appeal.facultyDescription}</div>
                    <div><strong>HOD Score:</strong> {appeal.hodScore}</div>
                    <div><strong>HOD Description:</strong> {appeal.hodDescription}</div>
                    <div><strong>Requested Score:</strong> {appeal.requestedScore}</div>
                    <div><strong>Evidence:</strong> {appeal.evidence}</div>
                    <div><strong>Reason:</strong> {appeal.appealReason}</div>
                    <div><strong>Status:</strong> {appeal.status}</div>

                    {!verified && (
                      <div className="grid gap-2 mt-2">
                        <Input
                          type="number"
                          value={input.score}
                          onChange={e => handleInputChange(appeal.id, 'score', Number(e.target.value))}
                          placeholder="Committee Score"
                        />
                        <Textarea
                          value={input.remarks}
                          onChange={e => handleInputChange(appeal.id, 'remarks', e.target.value)}
                          placeholder="Committee Remarks (optional)"
                        />
                        <Button onClick={() => submitCommitteeScore(appeal)}>Submit Verification</Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}

        <h2 className="text-xl font-bold">Verified Appeals</h2>
        {appeals.filter(appeal => !!(appeal.verifiedByCommittee ?? false)).length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No verified appeals.</p>
        ) : (
          appeals.filter(appeal => !!(appeal.verifiedByCommittee ?? false)).map(appeal => {
            const isExpanded = expandedIds.includes(appeal.id);
            const input = committeeInputs[appeal.id] || { score: appeal.committeeScore ?? 0, remarks: appeal.committeeRemarks ?? '' };
            const verified = appeal.verifiedByCommittee ?? false;

            return (
              <Card key={appeal.id} className="shadow-sm rounded-md">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>
                    {appeal.module} - {appeal.subId} - {appeal.criterionName}
                  </CardTitle>
                  {/* <StatusBadge status={verified ? 'verified' : 'pending'} /> */}
                  <Button  variant="outline" onClick={() => toggleExpand(appeal.id)}>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </Button>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Faculty Score:</strong> {appeal.claimedScore}</div>
                    <div><strong>Faculty Description:</strong> {appeal.facultyDescription}</div>
                    <div><strong>HOD Score:</strong> {appeal.hodScore}</div>
                    <div><strong>HOD Description:</strong> {appeal.hodDescription}</div>
                    <div><strong>Requested Score:</strong> {appeal.requestedScore}</div>
                    <div><strong>Evidence:</strong> {appeal.evidence}</div>
                    <div><strong>Reason:</strong> {appeal.appealReason}</div>
                    <div><strong>Status:</strong> {appeal.status}</div>

                    {!verified && (
                      <div className="grid gap-2 mt-2">
                        <Input
                          type="number"
                          value={input.score}
                          onChange={e => handleInputChange(appeal.id, 'score', Number(e.target.value))}
                          placeholder="Committee Score"
                        />
                        <Textarea
                          value={input.remarks}
                          onChange={e => handleInputChange(appeal.id, 'remarks', e.target.value)}
                          placeholder="Committee Remarks (optional)"
                        />
                        <Button onClick={() => submitCommitteeScore(appeal)}>Submit Verification</Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}