import { Router, type IRouter } from "express";
import { db, coursesTable, modulesTable, lessonsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GenerateCourseBody, GetCourseParams, DeleteCourseParams } from "@workspace/api-zod";
import { generateCourseOutline } from "../services/courseGenerator";

const router: IRouter = Router();

router.get("/courses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const courses = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.userId, req.user.id))
      .orderBy(desc(coursesTable.createdAt));

    const moduleCounts = await Promise.all(
      courses.map(async (course) => {
        const modules = await db
          .select({ id: modulesTable.id })
          .from(modulesTable)
          .where(eq(modulesTable.courseId, course.id));
        return { courseId: course.id, count: modules.length };
      })
    );

    const moduleCountMap = Object.fromEntries(moduleCounts.map((m) => [m.courseId, m.count]));

    res.json(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        topic: c.topic,
        tags: c.tags,
        moduleCount: moduleCountMap[c.id] ?? 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.post("/courses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = GenerateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { topic } = parsed.data;

  try {
    const outline = await generateCourseOutline(topic);

    const [course] = await db
      .insert(coursesTable)
      .values({
        title: outline.title,
        description: outline.description,
        topic,
        tags: outline.tags,
        userId: req.user.id,
      })
      .returning();

    let moduleCount = 0;
    for (let mi = 0; mi < outline.modules.length; mi++) {
      const moduleOutline = outline.modules[mi];
      const [module] = await db
        .insert(modulesTable)
        .values({
          title: moduleOutline.title,
          orderIndex: mi,
          courseId: course.id,
        })
        .returning();

      for (let li = 0; li < moduleOutline.lessons.length; li++) {
        const lesson = moduleOutline.lessons[li];
        await db.insert(lessonsTable).values({
          title: lesson.title,
          orderIndex: li,
          objectives: [],
          content: [],
          isGenerated: false,
          moduleId: module.id,
        });
      }
      moduleCount++;
    }

    res.status(201).json({
      id: course.id,
      title: course.title,
      description: course.description,
      topic: course.topic,
      tags: course.tags,
      moduleCount,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("Error generating course:", err);
    res.status(500).json({ error: "Failed to generate course" });
  }
});

router.get("/courses/:courseId", async (req, res) => {
  const parsed = GetCourseParams.safeParse({ courseId: parseInt(req.params.courseId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  try {
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, parsed.data.courseId));

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const modules = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.courseId, course.id))
      .orderBy(modulesTable.orderIndex);

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await db
          .select({
            id: lessonsTable.id,
            title: lessonsTable.title,
            orderIndex: lessonsTable.orderIndex,
            isGenerated: lessonsTable.isGenerated,
          })
          .from(lessonsTable)
          .where(eq(lessonsTable.moduleId, module.id))
          .orderBy(lessonsTable.orderIndex);

        return {
          id: module.id,
          title: module.title,
          orderIndex: module.orderIndex,
          lessons,
        };
      })
    );

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      topic: course.topic,
      tags: course.tags,
      modules: modulesWithLessons,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

router.delete("/courses/:courseId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = DeleteCourseParams.safeParse({ courseId: parseInt(req.params.courseId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  try {
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, parsed.data.courseId));

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    if (course.userId !== req.user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(coursesTable).where(eq(coursesTable.id, parsed.data.courseId));

    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

export default router;
