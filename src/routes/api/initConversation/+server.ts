import { db } from '$lib/server/db';
import { conversation, message, user } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { eq,sql} from 'drizzle-orm';





export const POST: RequestHandler = async ({ locals, request }) =>  {
    const  req  = await request.json();
    const user = locals.user;
  
    if (!user) {
      return new Response('User Not Signed in', { status: 401 });
    }

    const senderPublicKey = req.senderPubKey as string;
    const receiverPublicKey = req.recipientPubKey as string;
    const cipherText = req.cipherText;
    const ivBase64 = req.iv;
    const securityLevel = req.securityLevel

		const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    if (receiverPublicKey == senderPublicKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: true,
          message:"error - Can't start conversation with yourself" }), {
          headers: { 'Content-Type': 'application/json' }

          }
      );
    }


    if (!cipherText || !iv || !securityLevel) { 
        return new Response(
        JSON.stringify({ 
          success: false,
          error: true,
          message:"error - missing a required field" }), {
            headers: { 'Content-Type': 'application/json' }

          }
      );
    }
    if (senderPublicKey !== user.publicKey) {
      // Public Key Does Not Belong to User
        return new Response(
          JSON.stringify({ 
            success: false,
            error: true,
            message:"Not users Public key" }), {
              headers: { 'Content-Type': 'application/json' }

            }
        );
    }

    const insertConversation = await db.execute(sql`
      INSERT INTO conversation (participant_a, participant_b, security_level)
      SELECT u1.id, u2.id, ${securityLevel}
      FROM "user" u1, "user" u2
      WHERE u1.public_key = ${senderPublicKey} AND u2.public_key = ${receiverPublicKey}
      RETURNING id, participant_a, participant_b;
    `) as unknown as  [{ id: string, participant_a: string, participant_b: string }] ; // returns in id as a string in rows array
  
    
      

    if (!insertConversation) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: true,
          message:"Could Not initialize conversation or send message" }), {
            headers: { 'Content-Type': 'application/json' }

          }
      );
    }

    console.log("==============================================");
    const conversationId:string = insertConversation[0].id;
    const senderId : string = insertConversation[0].participant_a;

    await db.insert(message).values({
      conversationId,
      senderId,
      cipherText,
      iv
    })
    return new Response(
        JSON.stringify({ 
          success: true,
          error: false,
          message:"Conversation Started" }), {
            headers: { 'Content-Type': 'application/json' }

          }
      );
    
  }