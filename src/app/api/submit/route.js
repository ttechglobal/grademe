// src/app/api/submit/route.js
// POST — student submits assessment answers
// Server-side scoring: client-sent scores are ignored for integrity.

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// ─── SCORING HELPERS ──────────────────────────────────────────────────────────

function scoreMCQ(question, studentAnswer) {
  if (!studentAnswer) return false;
  const correct = (question.correct_answer || '').trim().toUpperCase()[0];
  const student = studentAnswer.trim().toUpperCase()[0];
  return correct === student;
}

function scoreTrueFalse(question, studentAnswer) {
  if (!studentAnswer) return false;
  const correct = /^true/i.test(question.correct_answer || '') ? 'true' : 'false';
  const student = /^true/i.test(studentAnswer) ? 'true' : 'false';
  return correct === student;
}

/**
 * scoreCalculation
 * studentBoxValues: { [boxId]: string }
 * Returns: { correct: boolean, boxResults: { [boxId]: 'correct' | 'wrong' } }
 */
function scoreCalculation(question, studentBoxValues) {
  const template = question.answer_template;
  if (!template || !template.structure?.length) {
    return { correct: false, boxResults: {} };
  }

  const boxResults = {};
  let allCorrect = true;

  for (const item of template.structure) {
    const studentVal = (studentBoxValues?.[item.id] || '').trim().toLowerCase();
    const accepted = (item.accepted || [item.answer]).map((a) =>
      String(a).trim().toLowerCase()
    );
    const isBoxCorrect = accepted.includes(studentVal);
    boxResults[item.id] = isBoxCorrect ? 'correct' : 'wrong';
    if (!isBoxCorrect) allCorrect = false;
  }

  return { correct: allCorrect, boxResults };
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      assessmentId,
      studentName,
      studentData,
      answers, // { [questionId]: string | { [boxId]: string } }
    } = body;

    if (!assessmentId || !studentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ── Fetch assessment ───────────────────────────────────────────────────
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, question_type, show_results, is_active')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (!assessment.is_active) {
      return NextResponse.json({ error: 'This assessment is no longer active' }, { status: 403 });
    }

    // ── Fetch questions ────────────────────────────────────────────────────
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_type, correct_answer, options, answer_template')
      .eq('assessment_id', assessmentId)
      .order('order_index');

    if (questionsError || !questions?.length) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    // ── Server-side scoring ────────────────────────────────────────────────
    let correctCount = 0;
    const scoredAnswers = {}; // what we store in submissions.answers
    // For calculation: also store boxResults so results page can use them
    const calculationResults = {}; // { [questionId]: { [boxId]: 'correct'|'wrong' } }

    for (const question of questions) {
      const qType = question.question_type || assessment.question_type;
      const studentAnswer = answers?.[question.id];

      if (qType === 'calculation') {
        // studentAnswer is { [boxId]: string }
        const boxValues = typeof studentAnswer === 'object' ? studentAnswer : {};
        const { correct, boxResults } = scoreCalculation(question, boxValues);
        if (correct) correctCount++;
        scoredAnswers[question.id] = boxValues;
        calculationResults[question.id] = boxResults;
      } else if (qType === 'true_false') {
        const isCorrect = scoreTrueFalse(question, studentAnswer);
        if (isCorrect) correctCount++;
        scoredAnswers[question.id] = studentAnswer || '';
      } else {
        // MCQ (default)
        const isCorrect = scoreMCQ(question, studentAnswer);
        if (isCorrect) correctCount++;
        scoredAnswers[question.id] = studentAnswer || '';
      }
    }

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // ── Get IP address ─────────────────────────────────────────────────────
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // ── Insert submission ──────────────────────────────────────────────────
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        assessment_id: assessmentId,
        student_name: studentName,
        student_data: studentData || {},
        answers: scoredAnswers,
        score: Math.round(score * 10) / 10,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString(),
        ip_address: ipAddress,
      })
      .select('id, score, total_questions')
      .single();

    if (submissionError) {
      console.error('[submit] Submission insert error:', submissionError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    // ── Build results payload ──────────────────────────────────────────────
    if (!assessment.show_results) {
      return NextResponse.json({
        success: true,
        submissionId: submission.id,
        score: submission.score,
        totalQuestions: submission.total_questions,
        correctCount,
        showResults: false,
      });
    }

    // Fetch full questions for results display
    const { data: fullQuestions } = await supabase
      .from('questions')
      .select('id, question_text, question_type, options, correct_answer, explanation, hint, answer_template, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index');

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      score: submission.score,
      totalQuestions: submission.total_questions,
      correctCount,
      showResults: true,
      questions: fullQuestions || [],
      answers: scoredAnswers,
      calculationResults, // { [qId]: { [boxId]: 'correct'|'wrong' } }
    });
  } catch (err) {
    console.error('[submit] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}