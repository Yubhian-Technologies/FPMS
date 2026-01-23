import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreCategory {
  name: string;
  shortName: string;
  score: number;
  maxScore: number;
  color: string;
}

const categories: ScoreCategory[] = [
  { name: "Teaching & Learning", shortName: "T&L", score: 72, maxScore: 100, color: "bg-primary" },
  { name: "Research & Consultancy", shortName: "R&C", score: 45, maxScore: 80, color: "bg-accent" },
  { name: "Professional Development", shortName: "PD", score: 28, maxScore: 40, color: "bg-info" },
  { name: "Student Development", shortName: "SD", score: 32, maxScore: 40, color: "bg-success" },
  { name: "Institutional Development", shortName: "ID", score: 35, maxScore: 40, color: "bg-warning" },
];

export function ScoreOverview() {
  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
  const maxTotalScore = 300;
  const percentComplete = Math.round((totalScore / maxTotalScore) * 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Score Overview</CardTitle>
          <span className="text-sm text-muted-foreground">AY 2024-25</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Score Circle */}
        <div className="flex items-center justify-center py-4">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${percentComplete * 2.83} 283`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">{totalScore}</span>
              <span className="text-lg text-muted-foreground">/{maxTotalScore}</span>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Total Score</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {categories.map((category) => {
            const percent = Math.round((category.score / category.maxScore) * 100);
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{category.name}</span>
                  <span className="text-muted-foreground">
                    {category.score}/{category.maxScore}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full ${category.color} transition-all duration-700 ease-out`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
