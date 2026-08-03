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
