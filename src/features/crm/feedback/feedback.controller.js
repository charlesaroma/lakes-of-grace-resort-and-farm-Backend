import { prisma } from '../../../lib/prisma.js';
import { createFeedbackSchema } from '../../../../shared/schemas/feedback.schema.js';

export const submitFeedback = async (req, res) => {
  try {
    const result = createFeedbackSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

    const { firstName, lastName, email, rating, title, comment, suggestions, ...evaluationRatings } = result.data;

    const [review, evaluation] = await Promise.all([
      prisma.review.create({
        data: { firstName, lastName, rating, title, comment },
      }),
      prisma.evaluation.create({
        data: {
          firstName,
          lastName,
          email,
          ...evaluationRatings,
          suggestions: suggestions || '',
        },
      }),
    ]);

    try {
      req.app.get('io')?.emit?.('evaluation:created', evaluation);
      req.app.get('io')?.emit?.('review:created', review);
    } catch { }

    res.status(201).json({ review, evaluation });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
