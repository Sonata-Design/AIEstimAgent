import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Folder, BarChart3, DollarSign } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import estimagentLogo from "@/assets/EstimAgent.png";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-background border-b border-border shadow-sm">
        <div className="relative flex items-center px-4 md:px-6 py-2">
          <div className="flex items-center">
            <Link href="/">
              <img 
                src={estimagentLogo} 
                alt="EstimAgent" 
                className="h-10 w-auto object-contain cursor-pointer dark:invert"
              />
            </Link>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className={location === "/" ? "text-primary bg-primary/10" : "text-muted-foreground"}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className={location === "/projects" ? "text-primary bg-primary/10" : "text-muted-foreground"}>
                <Folder className="w-4 h-4 mr-2" />
                Projects
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="ghost" size="sm" className={location === "/reports" ? "text-primary bg-primary/10" : "text-muted-foreground"}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </Button>
            </Link>
            <Link href="/advanced-cost-management">
              <Button variant="ghost" size="sm" className={location === "/advanced-cost-management" ? "text-primary bg-primary/10" : "text-muted-foreground"}>
                <DollarSign className="w-4 h-4 mr-2" />
                Advanced Costs
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}