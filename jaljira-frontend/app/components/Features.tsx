import { LayoutDashboard, BarChart3, Users, GitBranch, Bell, Shield } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Sprint Board",
    description: "Visualize your team's work with customizable Kanban boards and backlog management.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Gain deep insights with velocity charts, burndown graphs, and team performance reports.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Assign tasks, leave comments, mention teammates, and stay in sync across time zones.",
  },
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description: "Link commits, PRs, and branches directly to tickets. Keep code and tasks connected.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get notified about what matters. Customize alerts for your workflow priorities.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 Type II compliant with SSO, audit logs, and granular permission controls.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-6 bg-secondary/40">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything your team needs
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From planning to deployment, AgileFlow brings your entire workflow into one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
