<script lang="ts">

let messages = $state([]);
let resMsg = $state("");
const fetchInsecureMessages = async (e: SubmitEvent) => {
    e.preventDefault()

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const username = formData.get("hackUsername");

    let temp = await fetch("/api/insecureAPIRoute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      passedUsername: username
    })
    });
    let res = await temp.json()
    console.log(res)
    messages = res.data;
    
    return res;
}
    
</script>
<div>
    <h1 class="text-center text-3xl mt-5">Unsecure API ENDPOINT</h1>
    <div class=" bg-gray-200 p-4 max-w-md mx-auto my-10">
   <form
          method="post"
          class="flex justify-center flex-row-reverse mx-auto p-4 gap-x-2"
          onsubmit={fetchInsecureMessages}
        >
        <input name="hackUsername" placeholder="input username to view their messages" class="input input-neutral" type="text">
        <button class="btn btn-neutral" type="submit">submit</button>
    </form>
</div>
{#if messages.length > 0}
<div class="max-w-xl mx-auto">
    <h2 class="text-3xl text-center">{messages[0].user}'s Messages </h2>
   {#each messages as msg}
   <div class="my-4 text-lg bg-green-100">
    <p>
        <span class="font-bold">Conversation Id:</span>
         {msg.conversationId}
    </p>
    <p><span class="font-bold">Message Text:</span> {msg.message}</p>
   </div>
   {/each}
</div>
{/if}

</div>
