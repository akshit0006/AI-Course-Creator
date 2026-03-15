import { ai } from "@workspace/integrations-gemini-ai";

interface LessonTitle {
  title: string;
}

interface ModuleOutline {
  title: string;
  lessons: LessonTitle[];
}

interface CourseOutline {
  title: string;
  description: string;
  tags: string[];
  modules: ModuleOutline[];
}

interface ContentBlock {
  type: "heading" | "paragraph" | "code" | "video" | "mcq";
  text?: string;
  language?: string;
  query?: string;
  question?: string;
  options?: string[];
  answer?: number;
  explanation?: string;
}

interface LessonContent {
  title: string;
  objectives: string[];
  content: ContentBlock[];
}

export async function generateCourseOutline(topic: string): Promise<CourseOutline> {
  const prompt = `You are an expert curriculum designer. Generate a comprehensive course outline for the topic: "${topic}".

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "title": "Course title",
  "description": "2-3 sentence course description",
  "tags": ["tag1", "tag2", "tag3"],
  "modules": [
    {
      "title": "Module title",
      "lessons": [
        { "title": "Lesson title" }
      ]
    }
  ]
}

Requirements:
- Create 4-6 modules that progress logically from foundational to advanced
- Each module should have 3-5 lessons
- Titles should be specific and actionable
- Tags should be relevant keywords (3-5 tags)
- Description should explain what students will learn`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
  });

  const text = response.text ?? "";
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as CourseOutline;
}

export async function generateLessonContent(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string
): Promise<LessonContent> {
  const prompt = `You are an expert educator. Generate detailed lesson content for:
- Course: "${courseTitle}"
- Module: "${moduleTitle}"  
- Lesson: "${lessonTitle}"

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "title": "Lesson title",
  "objectives": ["Students will be able to...", "Students will understand..."],
  "content": [
    { "type": "heading", "text": "Section heading" },
    { "type": "paragraph", "text": "Detailed explanation paragraph..." },
    { "type": "code", "language": "python", "text": "# code example\\nprint('hello')" },
    { "type": "video", "query": "search query for YouTube educational video" },
    { "type": "mcq", "question": "Question text?", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "Why A is correct..." }
  ]
}

Requirements:
- Write 3-5 learning objectives starting with action verbs
- Include 2-3 heading/paragraph pairs with detailed content (200+ words per paragraph)
- Only include a code block if it's relevant to the topic (programming/technical topics)
- Include exactly 1 video block with a descriptive YouTube search query
- Include 4-5 MCQ questions at the end
- Each MCQ must have 4 options and an explanation for the correct answer
- answer is the 0-based index of the correct option`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
  });

  const text = response.text ?? "";
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as LessonContent;
}
