import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetCourse, useGetLesson, useGenerateLessonContent, getGetLessonQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Download, ArrowRight, Loader2, CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentBlockRenderer } from "@/components/lesson/ContentBlocks";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

export default function Lesson() {
  const [match, params] = useRoute("/courses/:courseId/lessons/:lessonId");
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;
  const lessonId = params?.lessonId ? parseInt(params.lessonId) : 0;

  const { data: course, isLoading: courseLoading } = useGetCourse(courseId, { 
    query: { enabled: !!courseId } 
  });
  
  const { data: lesson, isLoading: lessonLoading } = useGetLesson(lessonId, { 
    query: { enabled: !!lessonId } 
  });

  const { mutate: generateContent, isPending: isGenerating } = useGenerateLessonContent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLessonQueryKey(lessonId) });
      }
    }
  });

  // Calculate prev/next
  const allLessons = course?.modules.flatMap(m => m.lessons) || [];
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleDownload = async () => {
    const element = document.getElementById('lesson-content');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 1.5,
        useCORS: true,
        logging: false,
        ignoreElements: (el) => el.classList.contains('pdf-exclude'),
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const { jsPDF: JsPDF } = await import('jspdf');
      const pdf = new JsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let position = 0;
      let remainingHeight = imgHeight;
      
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;
      
      while (remainingHeight > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }
      
      pdf.save(`${lesson?.title.replace(/\s+/g, '-') || 'lesson'}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (courseLoading || lessonLoading) {
    return <div className="flex-1 min-h-[80vh] bg-muted/20 animate-pulse" />;
  }

  if (!lesson || !course) return <div className="p-8 text-center">Not found.</div>;

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto relative">
      {/* Sidebar Navigation */}
      <div className="w-80 shrink-0 border-r bg-card/40 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16">
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <Link href={`/courses/${courseId}`}>
            <h3 className="font-display font-bold text-lg mb-8 text-foreground hover:text-primary transition-colors pr-4">
              {course.title}
            </h3>
          </Link>
          <div className="space-y-8">
            {course.modules.map((module, mIdx) => (
              <div key={module.id}>
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                  <Layers className="w-3 h-3 mr-1.5" />
                  Module {mIdx + 1}
                </h4>
                <ul className="space-y-1 border-l-2 border-border/50 ml-1.5 pl-3">
                  {module.lessons.map((l, lIdx) => {
                    const isActive = lessonId === l.id;
                    return (
                      <li key={l.id}>
                        <Link 
                          href={`/courses/${courseId}/lessons/${l.id}`}
                          className={cn(
                            "block px-3 py-2 text-[14px] rounded-lg transition-all duration-200 leading-snug", 
                            isActive 
                              ? "bg-primary/10 text-primary font-bold shadow-sm translate-x-1" 
                              : "hover:bg-muted text-muted-foreground hover:text-foreground hover:translate-x-1 font-medium"
                          )}
                        >
                          <span className={cn("opacity-50 mr-2 font-mono text-[12px]", isActive && "opacity-80")}>
                            {mIdx + 1}.{lIdx + 1}
                          </span>
                          {l.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Breadcrumb - Mobile */}
        <div className="p-4 border-b md:hidden flex items-center text-sm text-muted-foreground bg-card">
          <Link href={`/courses/${courseId}`} className="hover:text-primary truncate">{course.title}</Link>
          <ChevronRight className="w-4 h-4 mx-1 shrink-0" />
          <span className="truncate">{lesson.title}</span>
        </div>

        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full min-h-[70vh]">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="relative w-32 h-32 flex items-center justify-center mb-8"
            >
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '1.5s' }} />
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </motion.div>
            <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">Crafting your lesson...</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Synthesizing learning materials, finding relevant videos, and preparing practice questions.
            </p>
          </div>
        ) : !lesson.isGenerated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[70vh] bg-gradient-to-b from-background to-muted/30">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-8 shadow-inner">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">Ready to dive in?</h2>
            <p className="text-muted-foreground text-lg max-w-lg mb-10 leading-relaxed">
              Generate comprehensive content for <strong>"{lesson.title}"</strong>. This will create detailed readings, code examples, embedded videos, and interactive quizzes.
            </p>
            <Button 
              size="lg" 
              onClick={() => generateContent({ lessonId })}
              className="px-10 py-6 text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
            >
              Generate Lesson Content
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 relative pb-24">
            <div id="lesson-content" className="p-6 md:p-12 max-w-4xl mx-auto bg-background rounded-2xl">
              {/* Header */}
              <div className="mb-12 border-b border-border pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center text-sm font-bold text-primary tracking-wider uppercase mb-4">
                      {lesson.moduleTitle}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground tracking-tight leading-tight">
                      {lesson.title}
                    </h1>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleDownload} 
                    disabled={isDownloading} 
                    className="shrink-0 rounded-xl hover-elevate bg-card border-border/80 shadow-sm pdf-exclude h-11 px-5"
                  >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    {isDownloading ? "Saving..." : "Save PDF"}
                  </Button>
                </div>

                {lesson.objectives && lesson.objectives.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 md:p-8 mt-8">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center text-lg">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Key Takeaways
                    </h3>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                      {lesson.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 mr-3 shrink-0" />
                          <span className="text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed font-medium">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Content */}
              <ContentBlockRenderer blocks={lesson.content} />
            </div>

            {/* Navigation Footer */}
            <div className="max-w-4xl mx-auto px-6 md:px-12 mt-12 border-t pt-8 pdf-exclude flex items-center justify-between gap-4">
              {prevLesson ? (
                <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`}>
                  <Button variant="outline" size="lg" className="rounded-xl h-14 px-6 border-border hover:border-primary/50 group w-full sm:w-auto justify-start">
                    <ChevronLeft className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Previous Lesson</span>
                      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px]">{prevLesson.title}</span>
                    </div>
                  </Button>
                </Link>
              ) : <div />}

              {nextLesson ? (
                <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                  <Button variant="default" size="lg" className="rounded-xl h-14 px-6 group w-full sm:w-auto justify-end">
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] uppercase font-bold opacity-80">Next Lesson</span>
                      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px]">{nextLesson.title}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/courses/${courseId}`}>
                  <Button variant="secondary" size="lg" className="rounded-xl h-14 px-8 font-bold">
                    Finish Course
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
