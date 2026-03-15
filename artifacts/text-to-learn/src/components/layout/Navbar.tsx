import { Link } from "wouter";
import { BookOpen, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Text-to-Learn
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <Button onClick={login} variant="default" className="font-medium px-6 hover-elevate">
              Log in
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-muted/50 py-1.5 px-2 rounded-full transition-colors outline-none focus:ring-2 focus:ring-primary/20">
                  <span className="text-sm font-medium hidden sm:block text-foreground/80">
                    {user?.firstName || user?.username || "User"}
                  </span>
                  <Avatar className="w-9 h-9 border border-border">
                    <AvatarImage src={user?.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {(user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl">
                <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                  <p className="font-medium truncate">{user?.username}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer w-full flex items-center py-2.5">
                    <Library className="w-4 h-4 mr-2 text-muted-foreground" />
                    My Courses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={logout} 
                  className="cursor-pointer py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 mt-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

function Library({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  )
}
