import { db } from '$lib/server/db';
import { message, user } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { getUserPublicKey } from '$lib/conversation/getUserPublicKey';
import { eq } from 'drizzle-orm';


export const POST: RequestHandler = async ({ locals, request }) =>  {
    const  req  = await request.json();
    const user = locals.user;
  
    if (!user) {
      return new Response('User Not Signed in', { status: 401 });
    }
    // console.log(req)
    const recipientPubKey = await getUserPublicKey(req.recipientUsername);

    
    if (!recipientPubKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: true,
          message:"error - no Public Key Associated with that username" }), {
            headers: { 'Content-Type': 'application/json' }

          }
      );
    }
    

    return new Response(
      JSON.stringify({
        success: true,
        error: false,
        message: "Public key found",
        data: { recipientPubKey }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    
  }
