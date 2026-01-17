import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackType, category, rating, message, pageReported } = await req.json();

    // Validate required fields
    if (!message || !rating || !feedbackType) {
      return Response.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Create feedback record
    await base44.entities.UserFeedback.create({
      feedback_type: feedbackType,
      category,
      rating,
      message,
      page_reported: pageReported
    });

    // Send notification email
    try {
      await base44.integrations.Core.SendEmail({
        to: 'admin@example.com',
        subject: `New ${feedbackType} from ${user.full_name}`,
        body: `
User: ${user.email}
Type: ${feedbackType}
Category: ${category}
Rating: ${rating}/5
Page/Feature: ${pageReported || 'Not specified'}

Feedback:
${message}
        `
      });
    } catch (emailError) {
      console.log('Email notification failed (feedback still saved):', emailError);
    }

    return Response.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return Response.json({ 
      error: error.message || 'Failed to submit feedback' 
    }, { status: 500 });
  }
});