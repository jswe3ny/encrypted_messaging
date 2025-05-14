import { db } from '$lib/server/db';
import { conversation, message, user } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';





export const POST: RequestHandler = async ({ locals, request }) =>  {
  // STILL NEED TO VALIDATE ALL FIELDS
    const  req  = await request.json();
    const user = locals.user;
    
    if (!user) {
      return new Response('User Not Signed in', { status: 401 });
    }
    const conversationId = req.conversationId
    const senderId = req.senderId;
    const cipherText = req.cipherText;
    const ivBase64 = req.iv;
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    if (!cipherText || !iv ) { 
        return new Response(
        JSON.stringify({ 
          success: false,
          error: true,
          message:"error - missing a required field" }), {
            headers: { 'Content-Type': 'application/json' }

          }
      );
    }
      // console.log("Date: ", ); // should still be 12

       await db.insert(message).values({
          conversationId,
          senderId,
          cipherText,
          iv
      })
   
   


    return new Response("message sent successfully")


}