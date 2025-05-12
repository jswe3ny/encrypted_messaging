import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';


export const getUserPublicKey = async (username : string) =>  {
    
    const pubKey  = await db.select({
        publicKey: user.publicKey
    }).from(user).where(eq(user.username, username));

    if (!pubKey[0]) {
        return null
    }


    // console.log(username)

    return pubKey[0].publicKey ?? null;
}
