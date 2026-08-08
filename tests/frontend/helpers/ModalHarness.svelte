<script lang="ts">
  import Modal from "$lib/ui/primitives/Modal.svelte";

  interface Props {
    title?: string;
    description?: string;
    onclose?: () => void;
  }

  let { title = "Dialog title", description, onclose }: Props = $props();

  let open = $state(false);

  function handleClose() {
    onclose?.();
    open = false;
  }
</script>

<button type="button" class="modal-trigger" onclick={() => (open = true)}>
  Open modal
</button>

<Modal {open} {title} {description} onclose={handleClose}>
  <p>Modal body</p>
</Modal>
