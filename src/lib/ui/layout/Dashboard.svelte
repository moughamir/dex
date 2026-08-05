<script>

import QuickActions from './QuickActions.svelte'
import StatsCard from './StatsCard.svelte'
import RecentActivity from './RecentActivity.svelte'
import AISuggestions from './AISuggestions.svelte'

</script>

<section>

<h1>

Good Afternoon 👋

</h1>

<p>

Everything is ready.

</p>

<QuickActions/>

<div class="stats">

<StatsCard
title="Projects"
value="14"
/>

<StatsCard
title="Agents"
value="6"
/>

<StatsCard
title="Files"
value="231"
/>

<StatsCard
title="Tasks"
value="48"
/>

</div>

<div class="grid">

<RecentActivity/>

<AISuggestions/>

</div>

</section>

<style>

section{

padding:30px;

overflow:auto;

}

.stats{

display:grid;

grid-template-columns:repeat(4,1fr);

gap:20px;

margin:30px 0;

}

.grid{

display:grid;

grid-template-columns:2fr 1fr;

gap:20px;

}

</style>
