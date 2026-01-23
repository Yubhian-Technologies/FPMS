import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Eye, 
  Edit, 
  ChevronRight,
  Calendar,
  User,
  TrendingUp
} from "lucide-react";

interface Submission {
  id: string;
  academicYear: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  submittedDate?: string;
  totalScore: number;
  maxScore: number;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    status: string;
  }[];
  reviewer?: string;
  remarks?: string;
}

const mockSubmissions: Submission[] = [
  {
    id: "1",
    academicYear: "2023-24",
    status: "under_review",
    submittedDate: "2024-01-15",
    totalScore: 245,
    maxScore: 300,
    reviewer: "Dr. Priya Sharma (HOD)",
    categories: [
      { name: "Teaching & Learning", score: 72, maxScore: 100, status: "approved" },
      { name: "Research & Consultancy", score: 58, maxScore: 80, status: "pending" },
      { name: "Professional Development", score: 38, maxScore: 50, status: "approved" },
      { name: "Student Development", score: 42, maxScore: 40, status: "pending" },
      { name: "Institutional Development", score: 35, maxScore: 30, status: "approved" },
    ],
  },
  {
    id: "2",
    academicYear: "2022-23",
    status: "approved",
    submittedDate: "2023-01-20",
    totalScore: 238,
    maxScore: 300,
    reviewer: "Dr. Priya Sharma (HOD)",
    remarks: "Excellent performance in research activities. Keep up the good work.",
    categories: [
      { name: "Teaching & Learning", score: 68, maxScore: 100, status: "approved" },
      { name: "Research & Consultancy", score: 55, maxScore: 80, status: "approved" },
      { name: "Professional Development", score: 40, maxScore: 50, status: "approved" },
      { name: "Student Development", score: 40, maxScore: 40, status: "approved" },
      { name: "Institutional Development", score: 35, maxScore: 30, status: "approved" },
    ],
  },
  {
    id: "3",
    academicYear: "2021-22",
    status: "approved",
    submittedDate: "2022-01-18",
    totalScore: 220,
    maxScore: 300,
    reviewer: "Dr. Anil Verma (HOD)",
    categories: [
      { name: "Teaching & Learning", score: 65, maxScore: 100, status: "approved" },
      { name: "Research & Consultancy", score: 48, maxScore: 80, status: "approved" },
      { name: "Professional Development", score: 35, maxScore: 50, status: "approved" },
      { name: "Student Development", score: 38, maxScore: 40, status: "approved" },
      { name: "Institutional Development", score: 34, maxScore: 30, status: "approved" },
    ],
  },
];

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: Edit },
  submitted: { label: "Submitted", variant: "info" as const, icon: Send },
  under_review: { label: "Under Review", variant: "warning" as const, icon: Clock },
  approved: { label: "Approved", variant: "success" as const, icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
};

export default function Submissions() {
  const currentSubmission = mockSubmissions[0];
  const previousSubmissions = mockSubmissions.slice(1);

  return (
    <DashboardLayout
      title="My Submissions"
      subtitle="Track and manage your FPMS form submissions"
      currentPath="/submissions"
    >
      <div className="space-y-6">
        {/* Current Submission Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle>Current Submission</CardTitle>
                  <Badge  className="gap-1">
                    {(() => {
                      const Icon = statusConfig[currentSubmission.status].icon;
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {statusConfig[currentSubmission.status].label}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Academic Year {currentSubmission.academicYear}
                </CardDescription>
              </div>
              <Button>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Score Progress */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Score</p>
                      <p className="text-3xl font-bold text-primary">
                        {currentSubmission.totalScore}
                        <span className="text-lg text-muted-foreground">/{currentSubmission.maxScore}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-accent">
                        {Math.round((currentSubmission.totalScore / currentSubmission.maxScore) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Achievement</p>
                    </div>
                  </div>
                  <Progress 
                    value={(currentSubmission.totalScore / currentSubmission.maxScore) * 100} 
                    className="h-3"
                  />
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Category Breakdown</h4>
                  {currentSubmission.categories.map((cat, index) => (
                    <div 
                      key={cat.name} 
                      className="flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-muted/30"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium">{cat.name}</p>
                          <Badge 
                           
                            className="ml-2"
                          >
                            {cat.status === "approved" ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Progress 
                            value={(cat.score / cat.maxScore) * 100} 
                            className="h-2 flex-1"
                          />
                          <span className="min-w-[60px] text-right text-sm font-medium">
                            {cat.score}/{cat.maxScore}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Info Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted On</p>
                    <p className="font-medium">{currentSubmission.submittedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reviewer</p>
                    <p className="font-medium">{currentSubmission.reviewer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <TrendingUp className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Performance</p>
                    <p className="font-medium">Above Average</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Submission
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Request Revision
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Previous Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
            <CardDescription>View your past FPMS submissions and performance trends</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Submissions</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="space-y-3">
                  {previousSubmissions.map((submission, index) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted/30"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Academic Year {submission.academicYear}</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted: {submission.submittedDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {submission.totalScore}/{submission.maxScore}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((submission.totalScore / submission.maxScore) * 100)}% Achievement
                          </p>
                        </div>
                        <Badge >
                          {statusConfig[submission.status].label}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="approved" className="mt-4">
                <div className="space-y-3">
                  {previousSubmissions
                    .filter((s) => s.status === "approved")
                    .map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Academic Year {submission.academicYear}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {submission.submittedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {submission.totalScore}/{submission.maxScore}
                            </p>
                          </div>
                          <Badge >Approved</Badge>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No pending submissions
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
