<script lang="ts">
  import {  onMount } from "svelte";
  import { enhance } from "$app/forms";
  import {
    importPublicKey,
    importPrivateKey,
    deriveAESKey,
    encryptMessage,
    decryptConversation,
  } from "$lib/cryptography/messageCryptography";
  import type { PageProps } from "./$types";
  import { updated } from "$app/state";

  let { data }: PageProps = $props();
  console.log(data.conversationMessages);

  type ChatMessage = {
    senderUsername: string;
    message: string;
    sentAt: Date;
    id: string;
  };

  let temp = $state<ChatMessage[]>();
  let errorMessage = $state("");
  let undecryptedErrorMessage = $state("");
  let encryptedMessages = data.conversationMessages;
  let privateKeyBase64 = $state("");
  // console.log(data.conversationMessages)


  const sendMessage = async (e: SubmitEvent) => {
    e.preventDefault();
    errorMessage = "";
    // Form Values:

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      if (
        !data.user.publicKey ||
        !data.otherUser.publicKey
      ) {
        // ensures nullable values present before post request sent
        return "Error - missing key info";
      }
      const conversationId: string = data.currentConversation.conversationId;
      const senderId: string = data.user.id;
      const receiverPublicKey: string = data.otherUser.publicKey;
      const unencryptedMessage = formData.get("message") as string;

      form.reset();
      if (!privateKeyBase64) {
        console.log("Input Private Key Before Sending messages");
        throw new Error(
          "Private key not loaded. Please input it before sending a message."
        );
      }

      if (!unencryptedMessage) {
        throw new Error("Text Field Empty - Add text to send message");
      }

      const importedPrivateKey = await importPrivateKey(privateKeyBase64); // test 2 purposes
      const importedPublicKey = await importPublicKey(receiverPublicKey);
      const sharedAesKey = await deriveAESKey(
        importedPrivateKey,
        importedPublicKey
      );

      const { cipherText, ivBase64 } = await encryptMessage(
        sharedAesKey,
        unencryptedMessage
      );
      // console.log("IV AFTER AES FUNCTION: " + ivBase64)
      console.log("sending")
      const res = await fetch("/api/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          senderId,
          cipherText,
          iv: ivBase64
        }),
      });
      let resData = await res.json;
      console.log(resData);
    } catch (e: any) {
      console.log(" sendMessage failed:", e.message ?? e);
      errorMessage = e.message ?? "Something Went Wrong";
      return { error: true, message: e.message };
    }
  };

  const handleDecryptSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    privateKeyBase64 = formData.get("userPrivateKeyBase64") as string;

    try {
      temp = await decryptConversation(
      data.conversationMessages,
      data.user,
      data.otherUser,
      privateKeyBase64
      );
    } catch (e: any) {
      undecryptedErrorMessage = e;
      console.log(e)
    }
   

    
  };

  const poll = async () => {
    if (temp && temp.length > 0 && privateKeyBase64) {

      let sentAt = temp?.at(-1)?.sentAt;
      if (sentAt && !(sentAt instanceof Date)) {
        sentAt = new Date(sentAt); // Convert string/number to Date
      }
      if(!sentAt) {
        console.log("invalid timpstamp")
        return
      }
      let latestMessageTimestamp = sentAt.toISOString() ;
      let latestMessageId = temp?.at(-1)?.id;
      const res = await fetch("/api/fetchNewMessages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUser: data.otherUser,
          latestMessageTimestamp,
          latestMessageId,
          conversationId: data.currentConversation.conversationId
        }),
      });
      
      const newEncryptedMessages = await res.json();
      if (newEncryptedMessages) {
        const newUnEncryptedMessages = await decryptConversation(
          newEncryptedMessages.data,
          data.user,
          data.otherUser,
          privateKeyBase64
        );
        // console.log("new meesages len: " + newUnEncryptedMessages)
        if (newUnEncryptedMessages) {
          // temp = temp
          const newerMessageTemp = [
            ...temp,
            ...newUnEncryptedMessages.map(msg => ({
              ...msg, 
              sentAt: new Date(msg.sentAt)
            }))
          ]
            temp = newerMessageTemp
        }
      }
    } else {
      //    console.log("Private key not imported, or messages not decrypted yet -- not polling")
    }

    setTimeout(poll, 5000);
  };


  const fetchOlderMessages = async (oldestMessage:ChatMessage) => {
    console.log("fucntion: " + oldestMessage.sentAt)
    let oldestMessageTimestamp = oldestMessage.sentAt.toISOString()
    const res = await fetch("/api/fetchOldMessages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldestMessageTimestamp,
          conversationId: data.currentConversation.conversationId
        }),
      });
    let olderMessages = await res.json();
    if (olderMessages) {
      const olderUnEncryptedMessages = await decryptConversation(
        olderMessages.data,
        data.user,
        data.otherUser,
        privateKeyBase64
      );

     if ( olderUnEncryptedMessages && temp) {
          const olderMessageTemp = [
            ...olderUnEncryptedMessages.map(msg => ({
              ...msg, 
              sentAt: new Date(msg.sentAt)
            })),
            ...temp
          ]
            temp = olderMessageTemp
      }
  }
  }


  onMount(() => {
   poll();
  });

  $effect(() => {
    temp;
    const feed = document.getElementById("feed");
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  });


</script>

<style>
  /* Hide scrollbar in Firefox */
  #feed {
    scrollbar-width: none; /* Firefox */
  }

  /* Hide scrollbar in Chrome, Safari, Edge */
  #feed::-webkit-scrollbar {
    display: none; /* WebKit */
  }
</style>

<div>
  <div>
    {#if !temp}
      <div class="relative w-full h-screen max-h-screen bg-blue-100 overflow-hidden">
        <div
          class=" bg-blue-200 max-w-3xl mx-auto flex flex-col justify-end gap-y-1 mb-10"
        >
          {#each encryptedMessages as message}
            <div class="p-3">
              <div
                class={`chat-header px-3 ${message.senderId === data.user.id ? "justify-end" : "justify-start"}`}
              >
                {message.senderId === data.user.id
                  ? data.user.username
                  : data.otherUser.username}
              </div>
              <div
                class={`chat chat-bubble max-w-sm
              ${message.senderId === data.user.id ? " chat-bubble-primary ml-auto chat-end" : "chat-bubble bg-gray-200"}`}
              >
                <p class="break-all text-lg">{message.cipherText}</p>
              </div>
            </div>
          {/each}
          {#if errorMessage}
            <div
              class=" max-w-md mx-auto w-full p-4 bg-red-500 text-white text-lg mb-2 mt-4 rounded-2xl font-semibold"
            >
              <p class="text-lg font-semiboldS mx-auto">
                Error: {errorMessage}
              </p>
            </div>
          {/if}
        </div>

        <div
          class="absolute inset-0 backdrop-blur-lg bg-black/10 flex flex-col items-center justify-center"
        >
        {#if undecryptedErrorMessage}
        <div class="max-w-md mx-auto w-full p-4 bg-red-500 text-white text-lg mb-2 mt-4 rounded-2xl font-semibold">
          <p class="text-center">{undecryptedErrorMessage}</p>
        </div>
        {/if}
          <form
            class="flex flex-col items-center bg-blue-400 w-[420px] p-5 rounded-2xl"
            onsubmit={handleDecryptSubmit}
          >
            <h1 class="text-xl font-semibold pb-10">
              Enter Private Key to view conversation
            </h1>

            <input
              class="input input-neutral min-w-[0px] mb-5"
              placeholder="Enter Private Key to Decrypt Messages"
              type="text"
              name="userPrivateKeyBase64"
            />
            <button class="btn btn-secondary mx-auto">Decrypt Messages</button>
          </form>
        </div>
      </div>
    {/if}
      {#key temp}
    {#if temp && temp.length > 0}
    <h1 class="text-3xl font-semibold text-center my-7">{data.otherUser.username}</h1>
    <div class="w-full flex justify-center ">
          <button onclick={() => temp?.[0] && fetchOlderMessages(temp[0])} class="btn btn-neutral">Load Older Messages</button>

        </div>
      <div
        class=" bg-blue-200 max-w-2xl mx-auto min-h-[700px] flex flex-col justify-end mb-10"
      >
  
      <div id="feed" class="max-h-[70vh] overflow-y-scroll p-4 rounded-2xl">
        {#each temp as message}
          <div class="p-3">
            <div
              class={`chat-header px-3 ${message.senderUsername === data.user.username ? "justify-end" : "justify-start"}`}
            >
              <!-- {console.log("sender: "+ message.username)} -->
              {message.senderUsername === data.user.username
                ? data.user.username
                : data.otherUser.username}
            </div>
            <div
              class={`chat chat-bubble max-w-sm
              ${message.senderUsername === data.user.username ? " chat-bubble-primary chat-end ml-auto" : "chat-start  chat-bubble bg-gray-200"}`}
            >
              <p class="break-all text-lg">{message.message}</p>
            </div>
            <p class={`chat-header px-3 ${message.senderUsername === data.user.username ? "justify-end" : "justify-start"}`}>{message.sentAt.getMonth() + 1}-{message.sentAt.getDate()}-{message.sentAt.getFullYear()} {message.sentAt.getHours()}:{String(message.sentAt.getMinutes()).padStart(2, '0')}</p>
          </div>
        {/each}
        {#if errorMessage}
          <div
            class=" max-w-md mx-auto w-full p-4 bg-red-500 text-white text-lg mb-2 mt-4 rounded-2xl font-semibold"
          >
            <p class="text-lg font-semiboldS mx-auto">Error: {errorMessage}</p>
          </div>
        {/if}
        <form
          class="flex flex-col max-w-md mx-auto items-center justify-end w-full mt-10"
          action="POST"
          onsubmit={sendMessage}
        >
          <textarea
            placeholder="Enter Message"
            class="textarea w-full focus:outline-none border-0"
            name="message"
          ></textarea>
          <button class="btn btn-lg btn-active btn-neutral max-w-min mt-4"
            >Send</button
          >
        </form>
      </div>
       
      </div>
    {/if}
    {/key}
  </div>
</div>
