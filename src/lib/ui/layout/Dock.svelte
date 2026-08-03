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
