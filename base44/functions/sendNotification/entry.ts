import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            user_email,
            title,
            message,
            type = 'info',
            category = 'general',
            action_url,
            related_entity_type,
            related_entity_id,
            priority = 'normal',
            send_email = true
        } = await req.json();

        // Validate required fields
        if (!user_email || !title || !message) {
            return Response.json({ 
                error: 'Missing required fields: user_email, title, message' 
            }, { status: 400 });
        }

        // Create in-app notification
        const notification = await base44.asServiceRole.entities.Notification.create({
            user_email,
            title,
            message,
            type,
            category,
            action_url,
            related_entity_type,
            related_entity_id,
            priority,
            is_read: false
        });

        // Send email notification if requested
        if (send_email) {
            try {
                const emailSubject = `[OptiMindHR] ${title}`;
                const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(to right, #059669, #047857); padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">OptiMindHR</h1>
                        </div>
                        <div style="padding: 30px; background: #f9fafb;">
                            <h2 style="color: #1f2937; margin-bottom: 20px;">${title}</h2>
                            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">${message}</p>
                            ${action_url ? `
                                <a href="${action_url}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                                    View Details
                                </a>
                            ` : ''}
                        </div>
                        <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                            <p>This is an automated notification from OptiMindHR.</p>
                            <p>© 2025 OptiMindHR. All rights reserved.</p>
                        </div>
                    </div>
                `;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user_email,
                    subject: emailSubject,
                    body: emailBody
                });

                // Mark email as sent
                await base44.asServiceRole.entities.Notification.update(notification.id, {
                    email_sent: true,
                    email_sent_at: new Date().toISOString()
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Don't fail the whole operation if email fails
            }
        }

        return Response.json({ 
            success: true,
            notification 
        });

    } catch (error) {
        console.error('Error in sendNotification:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});