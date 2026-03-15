import { Router, type IRouter } from "express";
import { db, lessonsTable, modulesTable, coursesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetLessonParams, GenerateLessonContentParams } from "@workspace/api-zod";
import { generateLessonContent } from "../services/courseGenerator";

const router: IRouter = Router();

router.get("/lessons/:lessonId", async (req, res) => {
  const parsed = GetLessonParams.safeParse({ lessonId: parseInt(req.params.lessonId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  try {
    const [lesson] = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, parsed.data.lessonId));

    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    const [module] = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, lesson.moduleId));

    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, module.courseId));

    res.json({
      id: lesson.id,
      title: lesson.title,
      objectives: lesson.objectives,
      content: lesson.content,
      isGenerated: lesson.isGenerated,
      moduleId: module.id,
      moduleTitle: module.title,
      courseId: course.id,
      courseTitle: course.title,
      orderIndex: lesson.orderIndex,
    });
  } catch (err) {
    console.error("Error fetching lesson:", err);
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
});

router.post("/lessons/:lessonId/generate", async (req, res) => {
  const parsed = GenerateLessonContentParams.safeParse({ lessonId: parseInt(req.params.lessonId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  try {
    const [lesson] = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, parsed.data.lessonId));

    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    const [module] = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, lesson.moduleId));

    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, module.courseId));

    const generated = await generateLessonContent(course.title, module.title, lesson.title);

    const [updatedLesson] = await db
      .update(lessonsTable)
      .set({
        objectives: generated.objectives,
        content: generated.content,
        isGenerated: true,
        updatedAt: new Date(),
      })
      .where(eq(lessonsTable.id, lesson.id))
      .returning();

    res.json({
      id: updatedLesson.id,
      title: updatedLesson.title,
      objectives: updatedLesson.objectives,
      content: updatedLesson.content,
      isGenerated: updatedLesson.isGenerated,
      moduleId: module.id,
      moduleTitle: module.title,
      courseId: course.id,
      courseTitle: course.title,
      orderIndex: updatedLesson.orderIndex,
    });
  } catch (err) {
    console.error("Error generating lesson content:", err);
    res.status(500).json({ error: "Failed to generate lesson content" });
  }
});

export default router;
