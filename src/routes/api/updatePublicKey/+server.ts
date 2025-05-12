import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';


export const POST: RequestHandler = async ({ locals, request }) =>  {
    const { publicKey } = await request.json();
    const username = locals.session?.username;
  
    if (!username) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const currentPubKey  = await db.select({
        publicKey: user.publicKey
    }).from(user).where(eq(user.username, username));

    if (currentPubKey[0].publicKey) {

        return new Response(JSON.stringify({
            error: "Error: Public Key already Generated.",
            publicKey: currentPubKey[0].publicKey
        }));
    }

    await db.update(user)
    .set({publicKey: publicKey}).where(eq(user.username, username));

  
    // return new Response('Public key added');
    return new Response(JSON.stringify({
        success: "Public Key Added, Be sure to store your private key somewhere safe!"
    }));
  }
