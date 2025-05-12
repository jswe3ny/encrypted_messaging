import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as tables from '$lib/server/db/schema';
import { eq, asc, or, and, desc } from 'drizzle-orm';
import { getUserPublicKey } from '$lib/conversation/getUserPublicKey';


export const load: PageServerLoad = async ({ parent, locals, params }) => {
  if (!locals.user) {
    return redirect(302, '/demo/lucia/login');
  }

  if (locals.user.username != params.user) {
    // return fail(403, "not allowed to access this page")
    error(403, { message: "This is not your page, you cant see it" })
  }
  // const publicKey = await getUserPublicKey(locals.user.username);
  const conversationId = params.conversation
  const { filteredConversations } = await parent();

  const currentConversation = filteredConversations.find(
    convo => convo.conversationId === params.conversation
  )

  // console.log(currentConversation)
  if (!currentConversation) {
    throw error(403, { message: 'conversation not found or not authorized' })
  }


  const currentUser = {
    username: locals.user.username,
    publicKey: locals.user.longTermPublicKey,
    id: locals.user.id
  };



  let conversationMessages = await db.select()
    .from(tables.message)
    .where(eq(tables.message.conversationId, conversationId))
    .orderBy(desc(tables.message.sentAt))
    .limit(20)

    conversationMessages = conversationMessages.reverse()

  if (conversationMessages.length < 1) {
    return error(403, { message: "error could not find this conversation" })
  }

  if (!currentConversation.otherPublicKey) {
    return error(403, { message: "Could not find other user" })
  }

  // console.log("+++++++++++++++++++++++++++++++++++++")
  // console.log(currentConversation)
  return { conversationMessages, currentUser, currentConversation }
};