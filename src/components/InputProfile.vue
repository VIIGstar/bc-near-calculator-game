<template>
  <div class="row">
    <label for="age">Age</label>
    <input type="number" id="age" v-model="profileAge"/>
    <label for="f_name">First name</label>
    <input id="f_name" v-model="profileFirstName"/>
    <label for="l_name">Last name</label>
    <input id="l_name" v-model="profileLastName"/>
  </div>
</template>

<script>

import {computed} from "vue";

export default {
  name: "Input-Profile",
  props: {
    profile: {
      type: Object,
      default: () => {}
    }
  },
  setup(props, { emit }) {
    const profileAge = computed({
      get() {
        return props.profile.age
      },
      set(val) {
        emit('update:profileAge', val)
      }
    })

    const profileFirstName = computed({
      get() {
        return props.profile.firstName
      },
      set(val) {
        emit('update:profileFirstName', val)
      }
    })

    const profileLastName = computed({
      get() {
        return props.profile.lastName
      },
      set(val) {
        emit('update:profileLastName', val)
      }
    })

    return {
      profileAge,
      profileFirstName,
      profileLastName,
    }
  }
}
</script>

<style scoped>

</style>