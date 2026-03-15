import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetCourses, useGenerateCourse, getGetCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Clock, Layers, ArrowRight, Library, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses, isLoading: loadingCourses } = useGetCourses({
    query: { enabled: !!isAuthenticated }
  });

  const { mutate: generateCourse, isPending: isGenerating } = useGenerateCourse({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetCoursesQueryKey() });
        setLocation(`/courses/${data.id}`);
      }
    }
  });

  useEffect(() => {
    const pending = localStorage.getItem('pending_topic');
    if (pending && isAuthenticated) {
      setTopic(pending);
      localStorage.removeItem('pending_topic');
      generateCourse({ data: { topic: pending } });
    }
  }, [isAuthenticated, generateCourse]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    generateCourse({ data: { topic } });
  };

  const handleLoginClick = () => {
    if (topic) localStorage.setItem('pending_topic', topic);
    login();
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative"
        >
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <Sparkles className="w-16 h-16 text-primary" />
        </motion.div>
        <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">Designing your curriculum...</h2>
        <p className="text-muted-foreground text-xl max-w-lg mx-auto leading-relaxed">
          Our AI is structuring modules, defining learning objectives, and preparing study materials. This usually takes 5-10 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-card border-b pt-24 pb-32">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Learning Paths</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-5 delay-100">
            Learn anything, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">instantly.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 delay-200">
            Enter a topic, and we'll generate a complete structured course with rich lessons, video resources, and quizzes tailored just for you.
          </p>

          <form onSubmit={handleGenerate} className="max-w-3xl mx-auto relative animate-in fade-in zoom-in-95 delay-300 duration-500">
            <input 
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Introduction to React Hooks, Basics of Copyright Law..."
              className="w-full pl-8 pr-40 py-6 rounded-2xl bg-background border-2 border-border shadow-xl text-lg md:text-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <div className="absolute right-3 top-3 bottom-3">
              {!isAuthenticated ? (
                <Button 
                  size="lg" 
                  type="button" 
                  onClick={handleLoginClick} 
                  className="h-full rounded-xl px-8 shadow-md hover-elevate font-bold"
                >
                  Log in to start
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={!topic.trim() || isGenerating} 
                  className="h-full rounded-xl px-8 shadow-md hover-elevate font-bold text-md"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Courses Grid */}
      {isAuthenticated && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-display font-bold">Your Library</h2>
          </div>
          
          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-2xl border p-6 h-64 animate-pulse" />
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map(course => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="group block rounded-2xl bg-card p-8 border border-border/80 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col cursor-pointer">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3 text-foreground line-clamp-2 leading-tight">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 mb-6 flex-1 text-sm leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border/50 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      <span className="flex items-center">
                        <Layers className="w-4 h-4 mr-2" />
                        {course.moduleCount} Modules
                      </span>
                      <span className="flex items-center ml-auto">
                        View Course <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 px-4 bg-card rounded-3xl border-2 border-dashed border-border mt-8">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Library className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">No courses yet</h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                Your generated courses will appear here. Enter a topic above to create your first learning path.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
