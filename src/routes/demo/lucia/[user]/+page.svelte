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
  let conversationErrorMessage = $state("");
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
    } else {
      console.log(message.error);
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

    const myPrivateKey = await importPrivateKey(privateKeyBase64) // test 2 purposes
    const recipientPubKeyBase64 = resData.data.recipientPubKey;
    const importedPublicKey = await importPublicKey(recipientPubKeyBase64); // public keys imported 
    const aesKey = await deriveAESKey(myPrivateKey, importedPublicKey);
    const { cipherText, ivBase64 } = await encryptMessage(aesKey, message);

    //@ts-ignore
    my_modal_2.close();
    form.reset()
    try {
    const res =  await fetch("/api/initConversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      senderPubKey: data.user.publicKey,
      recipientPubKey: recipientPubKeyBase64, 
      cipherText,
      iv: ivBase64,
      securityLevel: securityLevel
        })
      });
      
    conversationErrorMessage = "";
    const resJson = await res.json();
    
    if (resJson.success === false) {
      throw new Error(resJson.message);
    }
    } catch (e: any) {
      // console.log(e.message)
      conversationErrorMessage = e.message
    }

  };
</script>
<div class="max-w-6xl mx-auto">

{#if !data.user.publicKey}
  <button onclick={newUserKeyPair} class="bg-green-500 px-4 py-2"
    >Generate Keys</button
  >
  {#if pubKey && privKey}
  <div class="max-w-lg mx-auto">
    <p class="font-semibold">Public Key: </p>
    <p class="break-all">{pubKey}</p>
    <p class="font-semibold">Private Key: </p>
    <p class="break-all">{privKey}</p>
  </div>
  
  {/if}

{:else}
  <p>You're account has already generated your public/private keys</p>
   <button
      class="btn btn-neutral ml-8 mt-4"
      onclick={() => {
        // @ts-ignore
        my_modal_2.showModal();
      }}>Start Conversation</button
    >
{/if}

{#if temp}
  <p>{temp}</p>
{/if}

  <h1 class="text-4xl font-semibold text-center my-6">{data.user.username} signed in</h1>
  <div class="max-w-3xl mx-auto px-4 pb-4">
    {#if conversationErrorMessage}
    <div
            class=" max-w-md mx-auto w-full p-4 bg-red-500 text-white text-lg mb-2 mt-4 rounded-2xl font-semibold"
          >
            <p class="text-lg font-semiboldS mx-auto">Error: {conversationErrorMessage}</p>
          </div>
    {/if}
    <h3 class="text-3xl text-center">conversations</h3>

    {#each data.currentUserConversations as convo}
    <div class="bg-sky-200 flex flex-col p-10 mb-2 rounded-3xl mx-3">
      <a href={`./${data.user.username}/${convo.conversationId}`}>
        <p>Id: {convo.conversationId}</p>  
        <p>With: {data.user.username === convo.userAUsername ? convo.userBUsername : convo.userAUsername}</p>  
        <p>{convo.securityLevel}</p>
      </a>
    </div>
    {/each}


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
              required
            />
              <legend class="fieldset-legend">Private Key: </legend>
             <input
              name="privateKeyBase64"
              type="text"
              class="input w-full"
              placeholder="Private Key"
              required
            />
            <legend class="fieldset-legend">Tier</legend>
            <select required name="tier" class="select">
              <option disabled selected>Pick a security level</option>
              <option value="level_2">Level 2: Encrypted</option>
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
