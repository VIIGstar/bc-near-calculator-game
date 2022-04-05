<template>
  <div>
    <table>
      <thead>
      <th>
        Score
      </th>
        <th>
          User
        </th>
      </thead>
      <tbody>
        <tr v-for="(leader, idx) in leaderBoard" :key="idx" >
          <td>
            {{ leader[1].score }}
          </td>
          <td>
            {{ leader[0] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "LeaderBoard",
  props: {
    leaderBoard: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style scoped lang="scss">
table {
  color: white;
  font-family: pixel;
  font-size: 12px;
  text-align: left;
  margin-top: 8px;
  margin-left: 8px;

  th {
    text-align: center;
  }
}
</style>