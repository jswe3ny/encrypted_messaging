<script lang="ts">
  import { enhance } from "$app/forms";
  import { generateIdentityKeypair } from "$lib/cryptography/generateKeypair";
  import {importPublicKey, importPrivateKey, deriveAESKey, encryptMessage} from "$lib/cryptography/messageCryptography"
  import type { PageProps } from "./$types";
  // export let data;
  let { data }: PageProps = $props();

  // console.log(data)

  let pubKey = $state("");
  let privKey = $state("");
  let temp = $state("");
  const newUserKeyPair = async () => {
    const { publicKeyBase64, privateKeyBase64 } =
      await generateIdentityKeypair();

    // update user public key
    const res = await fetch("/api/updatePublicKey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: publicKeyBase64 }),
    });

    const message = await res.json();

    if (message.success) {
      pubKey = publicKeyBase64;
      privKey = privateKeyBase64;
      // console.log(message.success);
    } else {
      console.log(message.error);
      console.log("public Key: " + message.publicKey);
    }
  };



  const startNewConversation = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const recipient = formData.get("recipient")as string;
    const message = formData.get("message") as string;
    const securityLevel = formData.get("tier") as string;; // if you add `name="tier"` to the select
    const privateKeyBase64 = formData.get("privateKeyBase64") as string;
    const res = await fetch("/api/getRecipientPublicKey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientUsername: recipient,
        message: message,
        securityLevel: securityLevel,
      }),
    });

    const resData = await res.json();

    if (resData.error) {
      console.log(resData.message);
      return;
    }
        console.log("pk: " + privateKeyBase64)

    const myPrivateKey = await importPrivateKey(privateKeyBase64) // test 2 purposes
    const recipientPubKeyBase64 = resData.data.recipientPubKey;
    const importedPublicKey = await importPublicKey(recipientPubKeyBase64); // public keys imported 
    const aesKey = await deriveAESKey(myPrivateKey, importedPublicKey);
    const { cipherText, ivBase64 } = await encryptMessage(aesKey, message);



   
    // console.log(data.userData.getCurrentUserInfo[0].currentUserPublicKey)
    await fetch("/api/initConversation", {
      method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderPubKey: data.currentUser.publicKey,
      recipientPubKey: recipientPubKeyBase64, 
      cipherText,
      iv: ivBase64,
      securityLevel: securityLevel
    })
    });


  };
</script>

<form method="post" action="?/logout" use:enhance>
  <button class="px-4 py-2 font-semibold bg-red-600 text-white">Sign out</button
  >
</form>
{#if !data.currentUser.publicKey}
  <button onclick={newUserKeyPair} class="bg-green-500 px-4 py-2"
    >Generate Keys</button
  >
{:else}
  <p>You're account has already generated your public/private keys</p>
{/if}

{#if pubKey && privKey}
  <p>PubKey: {pubKey}</p>
  <p>PrivKey: {privKey}</p>
{/if}

{#if temp}
  <p>{temp}</p>
{/if}

<div>
  <h1>{data.currentUser.publicKey} signed in</h1>
  <div class="max-w-3xl mx-auto bg-sky-200">
    <h3 class="text-3xl text-center">conversations</h3>
    <!-- <button class="bg-sky-600 px-3 py-2 text-white hover:cursor-pointer ">Start Conversation</button> -->

    {#each data.filteredConversations as convo}
    <div class="bg-gray-200 flex flex-col p-10 mb-2">
      <a href={`./${data.currentUser.username}/${convo.conversationId}`}>
        <p>Id: {convo.conversationId}</p>  
        <p>With: {convo.otherUsername}</p>  
        <p>{convo.securityLevel}</p>
      </a>
     
    </div>
   

    {/each}

    <button
      class="btn"
      onclick={() => {
        // @ts-ignore
        my_modal_2.showModal();
      }}>open modal</button
    >
    <dialog id="my_modal_2" class="modal">
      <div class="modal-box">
        <form
          method="post"
          class="flex flex-col"
          onsubmit={startNewConversation}
        >
          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold text-lg"
              >Enter username you want to message:</legend
            >
            <legend class="fieldset-legend">Username: </legend>

            <input
              name="recipient"
              type="text"
              class="input w-full"
              placeholder="Username"
            />
              <legend class="fieldset-legend">Private Key: </legend>
             <input
              name="privateKeyBase64"
              type="text"
              class="input w-full"
              placeholder="Private Key"
            />
            <legend class="fieldset-legend">Tier</legend>
            <select name="tier" class="select">
              <option disabled selected>Pick a security tier</option>
              <option value="level_1">level 1: Plaintext</option>
              <option value="level_2">Level 2: PFS</option>
              <option value="level_3">Level 2.5: Per Convo Double Ratchet</option>
              <option value="level_4">Level 3: Ephmeral</option>
            </select>
            <legend class="fieldset-legend font-semibold text-lg"
              >Message:</legend
            >
            <textarea
              required
              name="message"
              class="textarea h-40 w-full"
              placeholder="Type Your Message"
            ></textarea>
          </fieldset>
          <button type="submit" class="btn">Send</button>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</div>
<p></p>
<p></p>
