<script lang='ts'>
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';	
	import { generateIdentityKeypair } from '$lib/cryptography/generateKeypair';
  	

	let { data }: { data: PageServerData } = $props();
	let pubKey = $state("");
	let privKey = $state("");
	let temp = $state("");
	

	const newUserKeyPair = async () => {
		const {publicKeyBase64, privateKeyBase64 } = await generateIdentityKeypair();
		
		// update user public key
		const res = await fetch('/api/updatePublicKey', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ publicKey: publicKeyBase64 }),
		});

		const message = await res.json();

		if (message.success) {
			pubKey = publicKeyBase64;
			privKey = privateKeyBase64;
			console.log(message.success)

		} else {
			console.log(message.error)
			console.log("public Key: " + message.publicKey)

		}
		

		
	}
</script>

<h1>Hi, {data.user.username}!</h1>
<p>Your user ID is {data.user.id}.</p>
<form method='post' action='?/logout' use:enhance>
	<button>Sign out</button>
</form>

<button onclick={newUserKeyPair} class="bg-green-500 px-4 py-2">Generate Keys</button>
{#if pubKey && privKey}
	<p>PubKey: {pubKey}</p>
	<p>PrivKey: {privKey}</p>
{/if}

{#if temp}
<p>{temp}</p>
{/if}

