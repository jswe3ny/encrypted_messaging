import type { RequestHandler } from '@sveltejs/kit';
import { getUserPublicKey } from '$lib/conversation/getUserPublicKey';
import { db } from '$lib/server/db';
import { conversation, message } from '$lib/server/db/schema';
import { and, eq,or,lt,gt,desc} from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) =>  {
    const  req  = await request.json();
    const user = locals.user;
    const oldestMessageTimestamp = new Date(req.oldestMessageTimestamp);
    const conversationId = req.conversationId
    // const latestMessageId = req.latestMessageId
    // const otherUserId = req.otherUser.id as string
    if (!user?.id) {
      return new Response('User Not Signed in', { status: 401 });
    }

    const olderMessages = await db.select()
        .from(message)
        .where(
            and(
                 eq(message.conversationId, conversationId),
                 lt(message.sentAt, oldestMessageTimestamp)
            )
        )
        .orderBy(desc(message.sentAt))
        .limit(10)

    // console.log("older messages: ")



if (olderMessages.length == 0) {
        return new Response(
            JSON.stringify({ 
              success: true,
              error: false,
              message:"No older messages",
                data: {}}), {
                headers: { 'Content-Type': 'application/json' }
              }
          );
    }

    // console.log()
        return new Response(
            JSON.stringify({ 
              success: true,
              error: false,
              message:"older Messages Inlcuded",
                data: olderMessages.reverse() 
              }), {
                headers: { 'Content-Type': 'application/json' }
              }
          );
}