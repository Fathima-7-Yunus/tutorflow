export async function callAi(systemPrompt: string, userPrompt: string) {
  try {
    const res = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      console.error('AI API error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    try {
      return JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null
    }
  } catch (err) {
    console.error('AI call failed:', err)
    return null
  }
}

interface StudentContext {
  name: string
  subject: string
  current_level: string
  learning_goals: string
  weak_areas: string
}

function studentContextLines(s: StudentContext) {
  return [
    `- Name: ${s.name}`,
    `- Subject: ${s.subject}`,
    `- Current level: ${s.current_level}`,
    `- Learning goals: ${s.learning_goals}`,
    `- Weak areas: ${s.weak_areas}`,
  ].join('\n')
}

export function buildPlanPrompt(
  student: StudentContext,
  topic: string,
  pastSessions: { topic: string; ai_review: string | null }[],
) {
  const pastSessionsText = pastSessions.length > 0
    ? pastSessions.map((s, i) => `Session ${i + 1}: Topic - ${s.topic}${s.ai_review ? `, Review: ${s.ai_review}` : ''}`).join('\n')
    : 'No past sessions yet.'

  return {
    systemPrompt: `You are an experienced one-to-one tutor creating a personalized lesson plan. Output a JSON object with:
- "objectives": an array of 2-3 learning objectives
- "outline": an array of exactly 4 main points for the lesson
- "practice_questions": an array of exactly 3 practice questions at the student's level

The plan must be tailored to this specific student's level, goals, and weak areas. Use past session data to avoid repeating topics.`,
    userPrompt: `Create a lesson plan for this student:
${studentContextLines(student)}

Topic for this session: ${topic}

Past sessions:
${pastSessionsText}

Output JSON with objectives, outline (4 points), and practice_questions (3).`,
  }
}

export function buildReviewPrompt(
  student: StudentContext,
  topic: string,
  notes: string,
  pastReviews: string[],
  plan: { objectives: string[] } | null,
) {
  const pastReviewsText = pastReviews.length > 0
    ? pastReviews.map((r, i) => `Review ${i + 1}: ${r}`).join('\n')
    : 'No past reviews yet.'

  const planText = plan
    ? `Original objectives: ${plan.objectives.join(', ')}`
    : 'No plan was created for this session.'

  return {
    systemPrompt: `You are a tutor writing a session review and assigning homework. Output a JSON object with:
- "summary": a concise paragraph summarising the session (what was covered, how the student performed, strengths and weaknesses shown)
- "homework": an array of exactly 2-3 homework tasks tailored to this student's weak areas and the session topic
- "next_suggestion": a single sentence recommending what to cover next time

Base homework on the student's weak areas and the session content. Homework should be specific and actionable.`,
    userPrompt: `Write a session review for this student:
${studentContextLines(student)}

Session topic: ${topic}

${planText}

Session notes:
${notes || 'No notes were taken during this session.'}

Past AI reviews:
${pastReviewsText}

Output JSON with summary, homework (2-3 items), and next_suggestion.`,
  }
}

export function buildProgressPrompt(sessions: { topic: string; ai_review: { summary: string; homework: string[]; next_suggestion: string } | null }[]) {
  const reviewsText = sessions
    .map((s, i) => {
      if (!s.ai_review) return null
      return `Session ${i + 1} (Topic: ${s.topic}):
Summary: ${s.ai_review.summary}
Homework: ${s.ai_review.homework.join(', ')}
Next suggestion: ${s.ai_review.next_suggestion}`
    })
    .filter(Boolean)
    .join('\n\n')

  return {
    systemPrompt: `You are an educational analyst. Based on AI session reviews, write a concise progress summary. Output JSON with:
- "summary": a short paragraph (3-5 sentences) describing where the student is improving and where they still struggle, with specific examples from the reviews.`,
    userPrompt: `Here are the AI session reviews for this student:\n\n${reviewsText}\n\nOutput JSON with a summary paragraph.`,
  }
}