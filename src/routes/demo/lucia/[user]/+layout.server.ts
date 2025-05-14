
import { getUserData } from '$lib/conversation/getUserData';
import { error } from 'console';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
      redirect(308, '/demo/lucia/login')
  }
  
  const user = locals.user
  const currentNestedUserConversations = await getUserData(user.id);

  return  { currentNestedUserConversations, user};
};