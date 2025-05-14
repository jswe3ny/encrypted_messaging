import { pgTable, uuid, pgEnum, text, timestamp, customType } from 'drizzle-orm/pg-core';
// schema.ts
import { alias} from 'drizzle-orm/pg-core';



const bytea = customType<{ data: Uint8Array | null }>({
	dataType: () => 'bytea',
	fromDriver(value: unknown): Uint8Array |null {
		if (value === null) return null;
		if (!(value instanceof Buffer)) {
		  throw new Error('Expected Buffer from database for BYTEA field');
		}
		return new Uint8Array(value);
	  }
});
  

export const securityLevelEnum = pgEnum('security_level', ['level_1', 'level_2', 'level_3', 'level_4']);


export const user = pgTable('user', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull().unique(),
	publicKey: text('public_key'),
 	createdAt: timestamp('created_at').defaultNow(),
	passwordHash: text('password_hash').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	username: text('username')
		.notNull()
		.references(() => user.username),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const conversation = pgTable('conversation', {
	id: uuid('id').defaultRandom().primaryKey(),
	participantA: uuid('participant_a').references(() => user.id, { onDelete: 'cascade' }),
	participantB: uuid('participant_b').references(() => user.id, { onDelete: 'cascade' }),
	securityLevel: securityLevelEnum('security_level').notNull(),
	createdAt: timestamp('created_at').defaultNow()
  });
  


export const message = pgTable('message', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversation.id),
  senderId: uuid('sender_id').references(() => user.id),
  cipherText: text('cipher_text').notNull(),
  iv: bytea('iv'),
  sentAt: timestamp('sent_at').defaultNow()
});


export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Conversation = typeof conversation.$inferSelect;

export type Message = typeof message.$inferSelect;
