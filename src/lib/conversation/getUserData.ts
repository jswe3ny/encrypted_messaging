import * as tables from '$lib/server/db/schema';

import { db } from '$lib/server/db';
import { eq, or } from 'drizzle-orm/gel-core/expressions';
import { alias } from 'drizzle-orm/pg-core';


export const getUserData = async (currentUserId:string) =>  {

	const userA = alias(tables.user, 'userA');
	const userB = alias(tables.user, 'userB');

	const currentUserConversations = await db.select({
		conversationId: tables.conversation.id,
		securityLevel: tables.conversation.securityLevel,
		createdAt: tables.conversation.createdAt,
		participantA: tables.conversation.participantA,
		participantB: tables.conversation.participantB,
		userAUsername: userA.username,
		userAPubKey: userA.publicKey,
		userBUsername: userB.username,
		userBPubKey: userB.publicKey,
	}).from(tables.conversation)
    .innerJoin(userA, eq(tables.conversation.participantA, userA.id))
    .innerJoin(userB, eq(tables.conversation.participantB, userB.id))
    .where(
      or(
        eq(tables.conversation.participantA, currentUserId),
        eq(tables.conversation.participantB, currentUserId)
      )
    );

	return { currentUserConversations };

}