<script lang="ts">
	// import '../app.css';
	
	let { data, children } = $props();
</script>

{#if data.user}
<nav class="navbar bg-base-100 shadow-sm">
  <div class="flex-1">
    <a href={`/demo/lucia/${data.user.username}`} class="btn btn-ghost text-xl">E2E Messaging </a>
  </div>
  <div class="flex-none">
    <ul class="menu menu-horizontal px-1">
        <form method="post" action={`/demo/lucia/${data.user.username}?/logout`}>
            <button type="submit">Logout</button>
        </form>
     
    </ul>
  </div>
</nav>
{/if }
{@render children()}
