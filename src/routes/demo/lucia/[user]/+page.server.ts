import type { PageServerLoad } from './$types';
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';



export const load: PageServerLoad = async ({parent, locals, params}) => {
	if (!locals.user) {
			return redirect(302, '/demo/lucia/login');
	}
	
	if(locals.user.username != params.user) {
		// return fail(403, "not allowed to access this page")
		error(403, {message: "This is not your page, you cant see it"})
	}
	let  {currentNestedUserConversations}   = await parent(); // ✅ accesses layout data
	const currentUserConversations = currentNestedUserConversations.currentUserConversations
	// console.log("nestes: ", currentNestedUserConversations)
	// console.log("n0:  ", currentUserConversations)
	return { currentUserConversations };
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/demo/lucia/login');
	},
};


