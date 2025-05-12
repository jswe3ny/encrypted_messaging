
import { getUserData } from '$lib/conversation/getUserData';
import { error } from 'console';
import type { LayoutServerLoad } from './$types';
import { conversation } from '$lib/server/db/schema';

export const load: LayoutServerLoad = async ({ locals, params }) => {
  if (!locals.user || locals.user.username !== params.user) {
    throw error(403, { message: 'Not authorized' });
  }

  const conversations = await getUserData(locals.user.id);
  return  conversations;
};