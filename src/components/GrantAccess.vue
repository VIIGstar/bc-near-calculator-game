<template>
  <div class="row">
    <label >Account ID</label>
    <input maxlength="32" v-model="internalValue" />
  </div>
</template>

<script>
import {computed} from "vue";

export default {
  name: "GrantAccess",
  props: {
    accountId: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const internalValue = computed({
      get () {
        return props.accountId
      },
      set(val) {
        emit('update:accountId', val)
      }
    })

    return {
      internalValue,
    }
  }
}
</script>

<style scoped>

</style>