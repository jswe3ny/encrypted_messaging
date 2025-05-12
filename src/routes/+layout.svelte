<script>
  let { data, children } = $props();
  import "../app.css";
</script>

{#if !data.user}
<nav class="navbar bg-base-100 shadow-sm">
  <div class="flex-1">
    <a href="/" class="btn btn-ghost text-xl">E2E Messaging </a>
  </div>
  <div class="flex-none">
    <ul class="menu menu-horizontal px-1">
     <a href="/demo/lucia/login">Login</a>
     
    </ul>
  </div>
</nav>
{/if}
{@render children()}