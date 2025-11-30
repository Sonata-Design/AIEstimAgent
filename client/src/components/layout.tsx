import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Folder, BarChart3, DollarSign } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import estimagentLogo from "@/assets/EstimAgent.png";

interface LayoutProps {
  children: React.ReactNode;
  actionButtons?: React.ReactNode;
}

export default function Layout({ children, actionButtons }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-background border-b border-border shadow-sm">
        <div className="flex items-center px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 gap-2 sm:gap-3 min-h-[52px]">
          {/* Logo - Left (flex-shrink-0 to prevent shrinking) */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/">
              <img 
                src={estimagentLogo} 
                alt="EstimAgent" 
                className="h-8 sm:h-9 md:h-10 w-auto object-contain cursor-pointer dark:invert"
              />
            </Link>
          </div>

          {/* Navigation Buttons - Center (flex-grow to take available space) */}
          <div className="hidden sm:flex items-center gap-0.5 md:gap-1 flex-grow justify-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className={`${location === "/" ? "text-primary bg-primary/10" : "text-muted-foreground"} text-xs md:text-sm h-7 md:h-8 px-1.5 md:px-2`}>
                <Home className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
                <span className="hidden md:inline text-xs md:text-sm">Dashboard</span>
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className={`${location === "/projects" ? "text-primary bg-primary/10" : "text-muted-foreground"} text-xs md:text-sm h-7 md:h-8 px-1.5 md:px-2`}>
                <Folder className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
                <span className="hidden md:inline text-xs md:text-sm">Projects</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="ghost" size="sm" className={`${location === "/reports" ? "text-primary bg-primary/10" : "text-muted-foreground"} text-xs md:text-sm h-7 md:h-8 px-1.5 md:px-2`}>
                <BarChart3 className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
                <span className="hidden md:inline text-xs md:text-sm">Reports</span>
              </Button>
            </Link>
            <Link href="/advanced-cost-management">
              <Button variant="ghost" size="sm" className={`${location === "/advanced-cost-management" ? "text-primary bg-primary/10" : "text-muted-foreground"} text-xs md:text-sm h-7 md:h-8 px-1.5 md:px-2`}>
                <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
                <span className="hidden lg:inline text-xs md:text-sm">Costs</span>
              </Button>
            </Link>
          </div>

          {/* Action Buttons & Theme Toggle - Right (flex-shrink-0 to prevent shrinking) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Action Buttons - Hidden on tablets, show on lg+ */}
            {actionButtons && (
              <div className="hidden lg:flex items-center gap-1 sm:gap-1">
                {actionButtons}
              </div>
            )}
            
            {/* Theme Toggle */}
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