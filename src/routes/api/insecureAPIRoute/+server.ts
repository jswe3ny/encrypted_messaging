import type { RequestHandler } from '@sveltejs/kit';
import { getUserPublicKey } from '$lib/conversation/getUserPublicKey';
import { db } from '$lib/server/db';
import { conversation, message,user } from '$lib/server/db/schema';
import { and, eq,or,lt,gt,desc} from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) =>  {
    const  req  = await request.json();
    const passedUsername = req.passedUsername
  
    
    const insecureMessageAcess = await db.select({
        user: user.username,
        message: message.cipherText,
        senderId: message.senderId,
        conversationId: message.conversationId
    })
        .from(message)
        .innerJoin(user, eq(user.username, passedUsername))
        .where(
            eq(user.id, message.senderId)
        )
        .orderBy(desc(message.conversationId))
        .limit(10)
    console.log("RES: " ,insecureMessageAcess)

if (insecureMessageAcess.length == 0) {
        return new Response(
            JSON.stringify({ 
              success: true,
              error: false,
              message:"No Messages Found ",
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
              message:"Hacked Messages",
                data: insecureMessageAcess.reverse() 
              }), {
                headers: { 'Content-Type': 'application/json' }
              }
          );
}