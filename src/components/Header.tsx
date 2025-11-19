import { Brain, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

/**
 * Header Component
 *
 * Displays the top bar of the extension with:
 * - Pocket LM logo and branding
 * - Active status indicator (yellow lightning bolt)
 * - Theme toggle button (moon/sun icon)
 */
export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between p-2 border-b border-border">
      {/* Left side: Logo and branding */}
      <div className="flex items-center gap-3">
        {/* Purple gradient logo circle with brain icon */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>

        {/* Brand name and status */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Pocket LM</h1>
          <span className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
            ⚡ Active
          </span>
        </div>
      </div>

      {/* Right side: Theme toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full w-10 h-10"
        onClick={toggleTheme}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </Button>
    </header>
  );
}
