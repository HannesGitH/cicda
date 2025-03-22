<script lang="ts">

  const _createBeam = async () => {
      const response = await fetch('/test', {
        method: 'POST'
      });
      const data = await response.json();
      console.log(data);
  }
</script>
<button on:click={() => _createBeam()}>Create Beam</button>