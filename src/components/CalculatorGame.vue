<template>
  <WelcomeIcon v-if="!onPlay" />
  <template v-else-if="!game.gameOver">
    <p style="font-family: 'pixel','serif'; color: white; font-size: 1.25rem">{{ game.x }} + {{ game.y }} = ?</p>
    <p style="font-family: 'pixel','serif'; color: white; margin: 0">Time left: {{ game.timeLeft }}s</p>
    <p style="font-family: 'pixel','serif'; color: white;">Score: {{ game.score }}</p>
  </template>
  <p v-else style="font-family: 'pixel','serif'; color: white; font-size: 1.25rem">Game Over
    <br />
    !!!
  </p>
</template>

<script>
import WelcomeIcon from "@/components/WelcomeIcon";
export default {
  name: "CalculatorGame",
  components: {WelcomeIcon},
  props: {
    game: {
      type: Object,
      default: () => {}
    },
    onPlay: Boolean
  }
}
</script>

<style scoped>

</style>