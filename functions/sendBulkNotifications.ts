import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notifications } = await req.json();

        if (!Array.isArray(notifications) || notifications.length === 0) {
            return Response.json({ 
                error: 'notifications must be a non-empty array' 
            }, { status: 400 });
        }

        const results = [];

        // Send notifications in parallel
        await Promise.all(
            notifications.map(async (notif) => {
                try {
                    const result = await base44.asServiceRole.functions.invoke('sendNotification', notif);
                    results.push({ success: true, data: result.data });
                } catch (error) {
                    results.push({ success: false, error: error.message });
                }
            })
        );

        const successCount = results.filter(r => r.success).length;

        return Response.json({ 
            success: true,
            total: notifications.length,
            successful: successCount,
            failed: notifications.length - successCount,
            results 
        });

    } catch (error) {
        console.error('Error in sendBulkNotifications:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});