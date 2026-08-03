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
