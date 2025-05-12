import { db } from '$lib/server/db';
import { conversation, message, user } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { eq,sql} from 'drizzle-orm';





export const POST: RequestHandler = async ({ locals, request }) =>  {
  // STILL NEED TO VALIDATE ALL FIELDS
  console.log("temp")
    const  req  = await request.json();
    const user = locals.user;
    
    if (!user) {
      return new Response('User Not Signed in', { status: 401 });
    }
    // const recipientPubKey = await getUserPublicKey(req.recipientUsername);
    const conversationId = req.conversationId
    const senderId = req.senderId
    const senderPublicKey = req.senderPubKey;
    const receiverId = req.receiverId;
    const receipientPublicKey = req.recipientPubKey;
    const cipherText = req.cipherText;
    const ivBase64 = req.iv;
    const securityLevel = req.securityLevel

    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    // console.log("IV: " + iv)
    // console.log("IV Lendth in API: " + iv.length)
    if (!cipherText || !iv || !securityLevel) { 
        // console.log("iv: " + iv)
        // console.log("rsec: " + securityLevel)
        // console.log("encrpytionText: " +cipherText)
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
          senderPublicKey,
          receiverId,
          receiverPublicKey:receipientPublicKey,
          cipherText,
          iv
      })
   
   

    console.log("sec level: " +securityLevel)

    return new Response("success")


}