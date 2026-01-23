import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GraduationCap,
  Target,
  ClipboardCheck,
  BarChart3,
  Shield,
  Users,
  FileText,
  Award,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: '300-Point Framework',
    description: 'Comprehensive evaluation aligned with NAAC, NBA, and NIRF requirements.',
  },
  {
    icon: ClipboardCheck,
    title: 'Multi-Stage Review',
    description: 'Structured workflow from Faculty → HOD → Committee with full audit trail.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Instant score calculations with visual breakdowns and performance insights.',
  },
  {
    icon: Shield,
    title: 'Evidence Validation',
    description: 'Secure upload and verification of supporting documents and certificates.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Faculty, HOD, Committee, and Admin roles with appropriate permissions.',
  },
  {
    icon: FileText,
    title: 'Export Reports',
    description: 'Generate PDF reports for individuals, departments, or institution-wide analysis.',
  },
];

const modules = [
  { name: 'Teaching & Learning', points: 70, color: 'bg-blue-500' },
  { name: 'Research & Consultancy', points: 75, color: 'bg-purple-500' },
  { name: 'Professional Development', points: 65, color: 'bg-teal-500' },
  { name: 'Student Development', points: 45, color: 'bg-orange-500' },
  { name: 'Institutional Development', points: 45, color: 'bg-pink-500' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">FPMS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
              <Award className="h-4 w-4 text-secondary" />
              <span>NAAC / NBA / NIRF Compliant</span>
            </div>
            
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Faculty Performance
              <span className="block text-secondary">Management System</span>
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Digitize and automate faculty performance evaluation with a comprehensive 
              300-point framework. Streamline reviews, track progress, and generate insights.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="gap-2 px-8">
                  Start Evaluation
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-primary">300</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-secondary">5</p>
                <p className="text-sm text-muted-foreground">Evaluation Modules</p>
              </div>
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-primary">4</p>
                <p className="text-sm text-muted-foreground">User Roles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">Evaluation Framework</h2>
            <p className="mt-3 text-muted-foreground">
              Five comprehensive modules covering all aspects of faculty performance
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {modules.map((module) => (
              <div
                key={module.name}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className={`h-3 w-3 rounded-full ${module.color}`} />
                <span className="flex-1 font-medium">{module.name}</span>
                <span className="font-display text-xl font-bold text-primary">{module.points}</span>
                <span className="text-sm text-muted-foreground">points</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 p-4">
              <span className="font-display text-lg font-semibold">Total Maximum Score</span>
              <span className="font-display text-2xl font-bold text-primary">300 points</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">Powerful Features</h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to manage faculty performance effectively
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Simple 4-step process for complete evaluation</p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { step: '01', title: 'Submit', desc: 'Faculty submits FPMS form with evidence' },
                { step: '02', title: 'HOD Review', desc: 'Department head reviews and forwards' },
                { step: '03', title: 'Committee', desc: 'FPMS committee final approval' },
                { step: '04', title: 'Locked', desc: 'Scores finalized and reports generated' },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                    <span className="font-display text-xl font-bold text-primary-foreground">{item.step}</span>
                  </div>
                  <h3 className="font-display font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                  {i < 3 && (
                    <div className="absolute top-8 left-full hidden w-full md:block">
                      <div className="h-0.5 w-full bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="gradient-primary border-0 text-primary-foreground">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <GraduationCap className="h-16 w-16 mb-6 opacity-90" />
              <h2 className="font-display text-3xl font-bold">Ready to Get Started?</h2>
              <p className="mt-4 max-w-md text-primary-foreground/80">
                Join institutions using FPMS for transparent and efficient faculty evaluation.
              </p>
              <Link to="/login" className="mt-8">
                <Button size="lg" variant="secondary" className="gap-2">
                  Access FPMS
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">FPMS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Faculty Performance Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}