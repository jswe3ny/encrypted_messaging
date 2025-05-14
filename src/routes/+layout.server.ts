
export const load = async ({ locals }) => {

  // if (!locals.user) {
	// 	return redirect(302, '/demo/lucia/login');
	// }
  
  return {
    user: locals.user
  };
};