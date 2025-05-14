import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {user, message, conversation} from '$lib/server/db/schema';
import { eq, asc, or, and, desc } from 'drizzle-orm';


export const load: PageServerLoad = async ({ parent, locals, params }) => {

  if (!locals.user) {
    return redirect(302, '/demo/lucia/login');
  }

  if (locals.user.username != params.user) {
    error(403, { message: "This is not your page, you cant see it" })
  }
  const conversationId = params.conversation
  const { currentNestedUserConversations } = await parent();

  const currentUserConversations = currentNestedUserConversations.currentUserConversations

  const currentConversation = currentUserConversations.find(
    convo => convo.conversationId === params.conversation
  )

  if (!currentConversation) {
    throw error(403, { message: 'conversation not found or not authorized' })
  }

  let conversationMessages = await db.select({
      id: message.id,
      cipherText: message.cipherText,
      iv: message.iv,
      sentAt: message.sentAt,
      senderId: message.senderId,
      senderUsername: user.username,
      senderPublicKey: user.publicKey,
  })
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .leftJoin(user, eq(message.senderId, user.id))
    .orderBy(desc(message.sentAt))
    .limit(10)

  //================= locals becasue of user table =======================
    const otherUser = (currentConversation.participantA === locals.user.id) 
      ? {
          id:currentConversation.participantB ?? '',
          username: currentConversation.userBUsername ?? '',
          publicKey: currentConversation.userBPubKey ?? ''
        }
      :
        {
          id:currentConversation.participantA ?? '',
          username: currentConversation.userAUsername ?? '',
          publicKey: currentConversation.userAPubKey ?? ''
        }

    conversationMessages = conversationMessages.reverse()
  if (conversationMessages.length < 1) {
    return error(403, { message: "error could not find this conversation" })
  }


  return { 
    conversationMessages, 
    otherUser, 
    currentConversation: {
      conversationId: currentConversation.conversationId,
      securityLevel: currentConversation.securityLevel,
      createdAt: currentConversation.createdAt
  } }
};