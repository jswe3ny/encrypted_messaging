import type { RequestHandler } from '@sveltejs/kit';
import { getUserPublicKey } from '$lib/conversation/getUserPublicKey';
import { db } from '$lib/server/db';
import { conversation, message } from '$lib/server/db/schema';
import { and, eq,or,lt,gt, gte, ne} from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) =>  {
    const  req  = await request.json();
    const user = locals.user;
    const latestMessageTimestamp = new Date(req.latestMessageTimestamp);
    const conversationId = req.conversationId
    const latestMessageId = req.latestMessageId
    const otherUserId = req.otherUser.id as string
    if (!otherUserId) {
        return new Response(
            JSON.stringify({ 
              success: false,
              error: true,
              message:"No Other User Id - aborting polling" }), {
                headers: { 'Content-Type': 'application/json' }
              }
          );
    }


    // console.log("latests: " + latestMessageTimestamp.toISOString())
    if (!latestMessageTimestamp) {
        return new Response(
            JSON.stringify({ 
              success: false,
              error: true,
              message:"No Timestamp Provided - aborting polling" }), {
                headers: { 'Content-Type': 'application/json' }
              }
          );
    }
    if (!user?.id) {
      return new Response('User Not Signed in', { status: 401 });
    }

    const newEncryptedMessages = await db.select().from(message)
    .where(
        and(
            eq(message.conversationId, conversationId),
            and(
              gt(message.sentAt, latestMessageTimestamp), 
              ne(message.id, latestMessageId)
            )
        )
      )

    console.log("new messages: ", newEncryptedMessages)


    if (newEncryptedMessages.length == 0) {
        return new Response(
            JSON.stringify({ 
              success: true,
              error: false,
              message:"No new messages",
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
              message:"latestest Messages Inlcuded",
                data: newEncryptedMessages 
              }), {
                headers: { 'Content-Type': 'application/json' }
              }
          );
    // }

   
    
}