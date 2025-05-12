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
	const   {filteredConversations }  = await parent(); // ✅ accesses layout data

	// console.log("convo: " + filteredConversations[3].otherUsername)
	// const filteredConversations = await getUserData(locals.user.id);
	const currentUser = {
		username: locals.user.username,
		id:locals.user.id,
		publicKey:locals.user.longTermPublicKey
	};
	return { filteredConversations, currentUser};
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


