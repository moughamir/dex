#!/usr/bin/env bash
set -e

echo "🚀 Creating Dex HUD..."

mkdir -p \
  src/routes \
  src/lib/layout

########################################
# +page
########################################

cat >src/routes/+page.svelte <<'EOF'
<script lang="ts">
	import HUD from "$lib/layout/HUD.svelte";
</script>

<HUD />
EOF

########################################
# HUD
########################################

cat >src/lib/layout/HUD.svelte <<'EOF'
<script lang="ts">
	import TopBar from "./TopBar.svelte";
	import Dock from "./Dock.svelte";
	import StatusBar from "./StatusBar.svelte";
</script>

<div class="hud">
	<TopBar />

	<main class="viewport">
		<div class="grid"></div>

		<section class="center">
			<h1>DEX</h1>
			<p>Desktop Experience</p>
		</section>
	</main>

	<Dock />

	<StatusBar />
</div>

<style>
.hud{
	width:100vw;
	height:100vh;

	display:grid;
	grid-template-rows:64px 1fr 72px 28px;
}

.viewport{
	position:relative;
	overflow:hidden;
}

.grid{
	position:absolute;
	inset:0;

	background:
		linear-gradient(rgba(0,212,255,.05) 1px, transparent 1px),
		linear-gradient(90deg, rgba(0,212,255,.05) 1px, transparent 1px);

	background-size:40px 40px;
}

.center{
	position:absolute;
	inset:0;

	display:grid;
	place-content:center;

	text-align:center;
}

h1{
	font-size:6rem;
	letter-spacing:.3em;
	color:#5ddcff;
}

p{
	margin-top:1rem;
	color:#9ecad8;
	letter-spacing:.4em;
}
</style>
EOF

########################################
# TOPBAR
########################################

cat >src/lib/layout/TopBar.svelte <<'EOF'
<script lang="ts">
	let time = $state("");

	const update = () =>
		time = new Date().toLocaleTimeString([],{
			hour:"2-digit",
			minute:"2-digit"
		});

	update();
	setInterval(update,1000);
</script>

<header>
	<div class="logo">DEX</div>

	<div>{time}</div>
</header>

<style>
header{
	display:flex;
	align-items:center;
	justify-content:space-between;

	padding:0 24px;

	backdrop-filter:blur(20px);

	background:rgba(15,20,30,.35);

	border-bottom:1px solid rgba(0,212,255,.2);
}

.logo{
	font-weight:700;
	letter-spacing:.3em;
	color:#5ddcff;
}
</style>
EOF

########################################
# DOCK
########################################

cat >src/lib/layout/Dock.svelte <<'EOF'
<script lang="ts">
	const apps=[
		"⌂",
		"🖥",
		"📝",
		"⚡",
		"🤖",
		"⚙"
	];
</script>

<nav>

{#each apps as app}

<button>{app}</button>

{/each}

</nav>

<style>
nav{
	display:flex;
	align-items:center;
	justify-content:center;
	gap:18px;

	background:rgba(15,20,30,.25);

	backdrop-filter:blur(20px);

	border-top:1px solid rgba(0,212,255,.15);
}

button{

	width:52px;
	height:52px;

	border:none;

	border-radius:16px;

	background:rgba(255,255,255,.05);

	color:white;

	cursor:pointer;

	transition:.2s;
}

button:hover{

	transform:translateY(-4px);

	background:rgba(0,212,255,.15);
}
</style>
EOF

########################################
# STATUSBAR
########################################

cat >src/lib/layout/StatusBar.svelte <<'EOF'
<footer>

READY

</footer>

<style>
footer{

	display:flex;

	align-items:center;

	padding:0 16px;

	font-size:.8rem;

	background:rgba(15,20,30,.3);

	border-top:1px solid rgba(255,255,255,.06);

	color:#8eaab7;
}
</style>
EOF

########################################
# APP.CSS
########################################

cat >src/app.css <<'EOF'
:root{

	color-scheme:dark;

	font-family:
		Inter,
		system-ui,
		sans-serif;

	background:transparent;
}

*{
	margin:0;
	padding:0;
	box-sizing:border-box;
}

html,
body{

	width:100%;
	height:100%;

	overflow:hidden;

	background:#05070b;

	color:white;
}

body{

	background:

	radial-gradient(circle at center,
	rgba(0,180,255,.08),
	transparent 65%),

	#05070b;
}

button{

	font:inherit;
}
EOF

echo ""
echo "✅ Initial Dex HUD created."
echo ""
echo "Run:"
echo "bun run tauri dev"
