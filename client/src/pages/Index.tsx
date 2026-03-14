import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/layout/Footer";
import vishnuLogo from "@/assets/vishnu.png";
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
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

const features = [
  {
    icon: Target,
    title: "300-Point Framework",
    description:
      "Comprehensive evaluation aligned with NAAC, NBA, and NIRF requirements.",
  },
  {
    icon: ClipboardCheck,
    title: "Multi-Stage Review",
    description:
      "Structured workflow from Faculty → HOD → Committee with full audit trail.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Instant score calculations with visual breakdowns and performance insights.",
  },
  {
    icon: Shield,
    title: "Evidence Validation",
    description:
      "Secure upload and verification of supporting documents and certificates.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Faculty, HOD, Committee, and Admin roles with appropriate permissions.",
  },
  {
    icon: FileText,
    title: "Export Reports",
    description:
      "Generate PDF reports for individuals, departments, or institution-wide analysis.",
  },
];

const modules = [
  { name: "Teaching & Learning", points: 70, color: "bg-blue-500" },
  { name: "Research & Consultancy", points: 75, color: "bg-purple-500" },
  { name: "Professional Development", points: 65, color: "bg-teal-500" },
  { name: "Student Development", points: 45, color: "bg-orange-500" },
  { name: "Institutional Development", points: 45, color: "bg-pink-500" },
];

// Counter Component for animated numbers
function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
}

// Floating Icon Component
function FloatingIcon({ icon: Icon, delay, className }: { icon: any; delay: number; className?: string }) {
  return (
    <div
      className={`absolute w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center backdrop-blur-md border border-primary/10 animate-float ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <Icon className="w-6 h-6 text-primary/60" />
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
              <img
                src={vishnuLogo}
                alt="Vishnu Logo"
                className="h-[100%] w-[120%] rounded-lg "
              />
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

      {/* Hero Section - Enhanced with Animations */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-40px) translateX(-10px); }
            75% { transform: translateY(-20px) translateX(10px); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(var(--primary), 0.3); }
            50% { box-shadow: 0 0 40px rgba(var(--primary), 0.6); }
          }
          
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes shimmer {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          
          @keyframes blob-animation {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -30px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(30px, 10px) scale(1.05); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-slide-down {
            animation: slideInDown 0.8s ease-out forwards;
          }
          
          .animate-slide-up {
            animation: slideInUp 0.8s ease-out forwards;
          }
          
          .animate-scale-in {
            animation: scaleIn 0.8s ease-out forwards;
          }
          
          .animate-shimmer {
            animation: shimmer 3s ease-in-out infinite;
          }
          
          .animate-blob {
            animation: blob-animation 8s ease-in-out infinite;
          }
          
          .text-animate {
            background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .gradient-text-animated {
            background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)));
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradient-shift 3s ease infinite;
          }
          
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% center; }
            50% { background-position: 100% center; }
          }
        `}</style>

        {/* Animated Gradient Blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gradient-to-br from-secondary via-transparent to-secondary/20 blur-3xl animate-blob opacity-70" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-gradient-to-bl from-primary via-transparent to-primary/10 blur-3xl animate-blob opacity-60" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-blob opacity-50" style={{ animationDelay: "4s" }} />

        {/* Floating Icon Elements */}
        <FloatingIcon icon={Sparkles} delay={0} className="top-1/4 left-5 md:left-20" />
        <FloatingIcon icon={Zap} delay={1} className="top-1/3 right-10 md:right-32" />
        <FloatingIcon icon={TrendingUp} delay={2} className="bottom-1/4 left-1/4" />
        <FloatingIcon icon={Target} delay={0.5} className="bottom-1/3 right-1/4" />

        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            {/* Main Heading with Animation */}
            <div className="animate-slide-down">
              <h1 className="font-display text-2xl sm:text-3xl md:text-6xl font-bold tracking-tight leading-tight">
                <span className=" ">Vishnu Educational </span>
                <span className="text-primary ">Society</span>
              </h1>
            </div>

            {/* Secondary Heading with Animation */}
            <div className="animate-slide-down" style={{ animationDelay: "0.2s" }}>
              <h2 className="mt-6 text-xl md:text-2xl font-semibold text-secondary animate-shimmer">
                Faculty Performance Management System
              </h2>
            </div>

            {/* Description with Animation */}
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed">
                Digitize and automate faculty performance evaluation with a
                <span className="font-semibold text-foreground"> comprehensive 300-point framework</span>. 
                Streamline reviews, track progress, and generate insights.
              </p>
            </div>

            {/* CTA Button with Enhanced Interaction */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-scale-in" style={{ animationDelay: "0.4s" }}>
              <Link to="/login" className="group">
                <Button 
                  size="lg" 
                  className="gap-2 px-8 text-lg font-semibold  duration-300 transform hover:scale-105"
                >
                  <span>Start Evaluation</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 text-lg border-2 hover:border-primary transition-all duration-300"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Animated Stats Section */}
            <div className="mt-20 animate-slide-up" style={{ animationDelay: "0.5s" }}>
              <div className="grid grid-cols-3 gap-4 md:gap-8">
                {[
                  { value: 300, label: "Total Points", icon: Target },
                  { value: 5, label: "Evaluation Modules", icon: ClipboardCheck },
                  { value: 5, label: "User Roles", icon: Users },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className="relative group p-4 md:p-6 rounded-2xl bg-gradient-to-br from-card/50 to-card/20 border border-primary/10 backdrop-blur-md hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                    style={{
                      animation: "slideInUp 0.8s ease-out forwards",
                      animationDelay: `${0.5 + index * 0.1}s`,
                      opacity: 0,
                    }}
                  >
                    <div className="mb-3 flex justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <AnimatedCounter end={stat.value} duration={2} />
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="mt-16 flex justify-center gap-2 animate-shimmer" style={{ animationDelay: "0.7s" }}>
              <div className="h-1 w-1 rounded-full bg-primary/50" />
              <div className="h-1 w-1.5 rounded-full bg-primary/70" />
              <div className="h-1 w-1 rounded-full bg-primary/50" />
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">
              Evaluation Framework
            </h2>
            <p className="mt-3 text-muted-foreground">
              Five comprehensive modules covering all aspects of faculty
              performance
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
                <span className="font-display text-xl font-bold text-primary">
                  {module.points}
                </span>
                <span className="text-sm text-muted-foreground">points</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 p-4">
              <span className="font-display text-lg font-semibold">
                Total Maximum Score
              </span>
              <span className="font-display text-2xl font-bold text-primary">
                300 points
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">
              Powerful Features
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to manage faculty performance effectively
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/50 transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
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
            <p className="mt-3 text-muted-foreground">
              Simple 4-step process for complete evaluation
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Submit",
                  desc: "Faculty submits FPMS form with evidence",
                },
                {
                  step: "02",
                  title: "HOD Review",
                  desc: "Department head reviews and forwards",
                },
                {
                  step: "03",
                  title: "Committee",
                  desc: "FPMS committee final approval",
                },
                {
                  step: "04",
                  title: "Locked",
                  desc: "Scores finalized and reports generated",
                },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                    <span className="font-display text-xl font-bold text-primary-foreground">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.desc}
                  </p>
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
              <h2 className="font-display text-3xl font-bold">
                Ready to Get Started?
              </h2>
              <p className="mt-4 max-w-md text-primary-foreground/80">
                Join institutions using FPMS for transparent and efficient
                faculty evaluation.
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
      <Footer />
    </div>
  );
}
