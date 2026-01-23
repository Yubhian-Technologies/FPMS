import { useAuth } from '@/contexts/AuthContext';
import { useFPMS } from '@/contexts/FPMSContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function Reports() {
  const { user } = useAuth();
  const { getAllSubmissions } = useFPMS();
  const [selectedYear, setSelectedYear] = useState('2024-25');

  if (!user) return null;

  const submissions = getAllSubmissions().filter((s) => s.academicYear === selectedYear);
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved' || s.status === 'locked');

  const averageScore =
    approvedSubmissions.length > 0
      ? Math.round(approvedSubmissions.reduce((sum, s) => sum + s.totalScore, 0) / approvedSubmissions.length)
      : 0;

  const highPerformers = approvedSubmissions.filter((s) => s.totalScore >= 240).length;
  const lowPerformers = approvedSubmissions.filter((s) => s.totalScore < 150).length;

  return (
    <DashboardLayout title='Reports'>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Performance Reports</h1>
            <p className="text-muted-foreground mt-1">View and export performance analytics</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-25">2024-25</SelectItem>
                <SelectItem value="2023-24">2023-24</SelectItem>
                <SelectItem value="2022-23">2022-23</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Evaluated</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-display">{approvedSubmissions.length}</p>
              <p className="text-xs text-muted-foreground">faculty members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-display text-primary">{averageScore}</p>
              <p className="text-xs text-muted-foreground">out of 300 points</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Performers</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-display text-success">{highPerformers}</p>
              <p className="text-xs text-muted-foreground">≥240 points</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Need Improvement</CardTitle>
              <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-display text-destructive">{lowPerformers}</p>
              <p className="text-xs text-muted-foreground">&lt;150 points</p>
            </CardContent>
          </Card>
        </div>

      
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Evaluation Summary</CardTitle>
            <CardDescription>All evaluated submissions for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No evaluated submissions for this academic year.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty ID</TableHead>
                    <TableHead>Teaching</TableHead>
                    <TableHead>Research</TableHead>
                    <TableHead>Professional</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Institutional</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.facultyId}</TableCell>
                      <TableCell>{submission.modules.find((m) => m.id === 'teaching')?.score || 0}</TableCell>
                      <TableCell>{submission.modules.find((m) => m.id === 'research')?.score || 0}</TableCell>
                      <TableCell>{submission.modules.find((m) => m.id === 'professional')?.score || 0}</TableCell>
                      <TableCell>{submission.modules.find((m) => m.id === 'student')?.score || 0}</TableCell>
                      <TableCell>{submission.modules.find((m) => m.id === 'institutional')?.score || 0}</TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">{submission.totalScore}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={submission.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}