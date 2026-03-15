import { useRoute, Link, useLocation } from "wouter";
import { useGetCourse, useDeleteCourse, getGetCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Layers, ArrowRight, Trash2, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Course() {
  const [match, params] = useRoute("/courses/:courseId");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;
  
  const { data: course, isLoading } = useGetCourse(courseId, { 
    query: { enabled: !!courseId } 
  });

  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCoursesQueryKey() });
        setLocation("/");
      }
    }
  });

  if (isLoading) {
    return <div className="flex-1 p-8 animate-pulse bg-muted/20 min-h-[80vh]" />;
  }

  if (!course) {
    return <div className="p-8 text-center text-muted-foreground">Course not found.</div>;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
      {/* Sidebar */}
      <div className="w-full md:w-80 shrink-0 border-r bg-card/30 md:flex flex-col md:min-h-[calc(100vh-4rem)] md:sticky md:top-16 hidden">
        <div className="p-6 overflow-y-auto flex-1">
          <Link href="/">
            <div className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Library
            </div>
          </Link>
          <h3 className="font-display font-bold text-xl mb-8 text-foreground leading-tight">
            {course.title}
          </h3>
          <div className="space-y-8">
            {course.modules.map((module, mIdx) => (
              <div key={module.id}>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-2" />
                  Module {mIdx + 1}
                </h4>
                <ul className="space-y-2 border-l-2 border-border/60 ml-2 pl-4">
                  {module.lessons.map((l, lIdx) => (
                    <li key={l.id}>
                      <Link 
                        href={`/courses/${courseId}/lessons/${l.id}`}
                        className="block py-1.5 text-[15px] font-medium text-foreground/70 hover:text-primary transition-all duration-200 hover:translate-x-1"
                      >
                        <span className="opacity-40 mr-2 text-xs">{mIdx + 1}.{lIdx + 1}</span>
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-24">
        <div className="md:hidden mb-6">
          <Link href="/">
            <div className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Library
            </div>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {course.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-6 leading-tight">
              {course.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {course.description}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors no-default-hover-elevate"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this entire course?")) {
                deleteCourse({ courseId });
              }
            }}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Course
          </Button>
        </div>

        <div className="grid gap-8 mt-12">
          {course.modules.map((module, mIdx) => (
            <div key={module.id} className="bg-card rounded-3xl border border-border shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-5 mb-8 pb-6 border-b border-border/50">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-2xl shrink-0">
                  {mIdx + 1}
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {module.title}
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {module.lessons.map((lesson, lIdx) => (
                  <Link 
                    key={lesson.id} 
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="flex items-center justify-between p-5 rounded-2xl border border-border/80 bg-background hover:bg-primary/5 hover:border-primary/40 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        {mIdx + 1}.{lIdx + 1}
                      </div>
                      <span className="font-semibold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors">
                        {lesson.title}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
