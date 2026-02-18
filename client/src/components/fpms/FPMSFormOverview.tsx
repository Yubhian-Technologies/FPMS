import { CategoryCard } from "./CategoryCard";

interface FPMSFormOverviewProps {
  submissions: any[];
}

export function FPMSFormOverview({ submissions }: FPMSFormOverviewProps) {
  const categoriesMap: Record<string, any> = {
    "Teaching & Learning": {
      description: "Lectures, feedback, curriculum development, innovations",
      score: 0,
      maxScore: 100,
      completedItems: 0,
      totalItems: 12,
      href: "/fpms/teaching",
    },
    "Research & Consultancy": {
      description: "Publications, projects, patents, consultancy work",
      score: 0,
      maxScore: 80,
      completedItems: 0,
      totalItems: 10,
      href: "/fpms/research",
    },
    "Professional Development": {
      description: "FDPs, certifications, workshops, memberships",
      score: 0,
      maxScore: 40,
      completedItems: 0,
      totalItems: 8,
      href: "/fpms/professional",
    },
    "Student Development": {
      description: "Mentoring, placements, competitions, activities",
      score: 0,
      maxScore: 40,
      completedItems: 0,
      totalItems: 8,
      href: "/fpms/student",
    },
    "Institutional Development": {
      description: "Accreditation, committees, outreach, admin duties",
      score: 0,
      maxScore: 40,
      completedItems: 0,
      totalItems: 10,
      href: "/fpms/institutional",
    },
  };

  submissions.forEach((sub) => {
    const crit = sub.criteriaName;
    if (categoriesMap[crit]) {
      categoriesMap[crit].score += (sub.finalScore ?? 0);
      categoriesMap[crit].completedItems += 1;
    }
  });

  const displayCategories = Object.entries(categoriesMap).map(([title, data]) => ({
    title,
    ...data,
    status: data.score >= data.maxScore ? "complete" : data.score > 0 ? "in-progress" : "needs-review"
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {displayCategories.map((category, index) => (
        <div 
          key={category.title}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CategoryCard {...category as any} />
        </div>
      ))}
    </div>
  );
}
