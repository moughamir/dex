<script lang="ts">
    import TopBar from "./TopBar.svelte";
    import Dock from "./Dock.svelte";
    import StatusBar from "./StatusBar.svelte";
</script>

<div class="hud">

    <TopBar />

    <main class="viewport">

        <div class="scene">

            <div class="grid"></div>

            <div class="message">
                DEX
                <span>Desktop Experience</span>
            </div>

        </div>

    </main>

    <Dock />

    <StatusBar />

</div>
