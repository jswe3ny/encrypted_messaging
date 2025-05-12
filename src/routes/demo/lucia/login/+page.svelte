<script lang='ts'>
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<form class="flex flex-col items-center bg-gray-200 max-w-sm mx-auto p-5 rounded-2xl mt-20" method='post' action='?/login' use:enhance>
	<h2 class="text-3xl font-semibold mb-10">Login or Register</h2>
	<label class=" pl-4 self-start">Username</label>
	<input type="text" name="username" placeholder="username" class="input input-md mb-6" />
	<label class=" pl-4 self-start" >Password</label>
	<input type="password" name="password" placeholder="password" class="input input-md" />
	<div class="flex justify-evenly w-full">
		<button class="btn btn-primary mx-auto mt-4">Login</button>
	<button class="btn btn-success mx-auto mt-4" formaction='?/register'>Register</button>
	</div>
	
	
</form>
<p style='color: red'>{form?.message ?? ''}</p>
