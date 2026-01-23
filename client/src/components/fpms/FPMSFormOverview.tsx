import { CategoryCard } from "./CategoryCard";

const categories = [
  {
    title: "Teaching & Learning",
    description: "Lectures, feedback, curriculum development, innovations",
    score: 72,
    maxScore: 100,
    completedItems: 8,
    totalItems: 12,
    status: "in-progress" as const,
    href: "/fpms/teaching",
  },
  {
    title: "Research & Consultancy",
    description: "Publications, projects, patents, consultancy work",
    score: 45,
    maxScore: 80,
    completedItems: 5,
    totalItems: 10,
    status: "in-progress" as const,
    href: "/fpms/research",
  },
  {
    title: "Professional Development",
    description: "FDPs, certifications, workshops, memberships",
    score: 28,
    maxScore: 40,
    completedItems: 6,
    totalItems: 8,
    status: "complete" as const,
    href: "/fpms/professional",
  },
  {
    title: "Student Development",
    description: "Mentoring, placements, competitions, activities",
    score: 32,
    maxScore: 40,
    completedItems: 7,
    totalItems: 8,
    status: "complete" as const,
    href: "/fpms/student",
  },
  {
    title: "Institutional Development",
    description: "Accreditation, committees, outreach, admin duties",
    score: 15,
    maxScore: 40,
    completedItems: 3,
    totalItems: 10,
    status: "needs-review" as const,
    href: "/fpms/institutional",
  },
];

export function FPMSFormOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category, index) => (
        <div 
          key={category.title}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CategoryCard {...category} />
        </div>
      ))}
    </div>
  );
}
