<template>
  <div class="container">
    <h1>Profile state smart contract</h1>

    <div class="sign-in" v-if="!loaded">
      <p>You'll need to sign in to call contract methods:</p>
      <button class="btn btn-primary" style="background-color: #0072ce">
        Sign In
      </button>
    </div>

    <div class="after-sign-in" v-else>
      <div class="scene">
        <div class="gameboy">
          <div class="body-shape shadow"></div>
          <div class="body-shape side"></div>
          <div class="body-shape front">
            <div class="screen">
              <CalculatorGame
                v-if="!showLeaderBoard"
                :on-play="onPlay"
                :game="game"
              />
              <LeaderBoard v-else :leader-board="leaderBoard" />
            </div>
            <div class="buttons">
              <template v-if="logged">
                <InputProfile
                  v-if="!onPlay"
                  :profile="profile"
                  v-model:profileAge="profile.age"
                  v-model:profileFirstName="profile.firstName"
                  v-model:profileLastName="profile.lastName"
                />
                <div v-else class="selects row" style="margin-bottom: 16px">
                  <div
                    class="ab__left"
                    style="
                      display: flex;
                      justify-content: center;
                      align-items: center;
                    "
                  >
                    <input v-model="game.total" class="input-game" />
                    <button
                      class="btn-action btn-action__submit"
                      :disabled="!onPlay || game.onSaving"
                      @click="submitGame"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </template>
              <GrantAccess v-else v-model:accountId="accountId" />
              <div class="selects row">
                <div class="ab__left">
                  <button
                    class="btn-action btn-action__play"
                    :disabled="!logged || game.onSaving"
                    @click="playGame"
                  >
                    Play
                  </button>
                  <button
                    class="btn-action btn-action__rank"
                    @click="getLeaderBoard"
                  >
                    Rank
                  </button>
                </div>
                <div class="ab">
                  <button
                    class="r a"
                    @click="access"
                    :disabled="logged || isCallContract"
                  >
                    In
                  </button>
                  <button class="r b" :disabled="true" @click="getInfo">
                    X
                  </button>
                  <button class="r c" :disabled="true" @click="setInfo">
                    Y
                  </button>
                  <button v-if="logged" class="r d" @click="logged = false">
                    Out
                  </button>
                  <button
                    v-else
                    class="r d"
                    @click="grantAccess"
                    :disabled="isCallContract"
                    :class="showHint ? 'highlight' : ''"
                  >
                    Reg
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import InputProfile from "@/components/InputProfile";
import GrantAccess from "@/components/GrantAccess";
import { SmartContractMixins } from "@/mixins/loginSmartContractMixins";
import CalculatorGame from "@/components/CalculatorGame";
import LeaderBoard from "@/components/LeaderBoard";
const newGameDefault = () => {
  return {
    x: 0,
    y: 0,
    score: 0,
    total: "",
    intervalTimeLeft: null,
    timeLeft: 3,
    timeoutGameOver: null,
    gameOver: false,
    onSaving: false,
  };
};

export default {
  name: "App",
  components: { LeaderBoard, CalculatorGame, GrantAccess, InputProfile },
  mixins: [SmartContractMixins],
  data() {
    return {
      loaded: false,
      logged: false,
      isCallContract: false,
      onPlay: false,
      showLeaderBoard: false,
      showHint: false,
      accountId: "",
      profile: {
        age: 0,
        firstName: "",
        lastName: "",
        highestScore: -1,
      },
      eventListeners: [],
      leaderBoard: [],
      game: newGameDefault(),
    };
  },
  async created() {
    return this.init();
  },

  beforeUnmount() {
    this.removeEvents();
  },

  methods: {
    init() {
      this.signInWallet()
        .then(() => {
          this.loaded = true;
          return Promise.resolve();
        })
        .then(this.initializeSessionData)
        .then(this.checkPreviousTransaction);
    },
    removeEvents() {
      this.eventListeners.forEach((item) => {
        document.removeEventListener(item.event, item.listener);
      });
      this.eventListeners = [];
    },
    initializeSessionData() {
      this.logged =
        sessionStorage.getItem("accountLogged")?.toLowerCase() === "true";
      if (this.logged) {
        this.accountId = sessionStorage.getItem("accountId") || "";
        // double check
        return this.access();
      }
    },
    reset() {
      this.game.timeLeft = 3;
      clearInterval(this.game.intervalTimeLeft);
      clearTimeout(this.game.timeoutGameOver);
    },
    startGame() {
      this.game.x = Math.floor(Math.random() * 50);
      this.game.y = Math.floor(Math.random() * 50);
      this.game.timeoutGameOver = setTimeout(() => {
        this.game.gameOver = true;
        if (this.game.score > 0) {
          this.saveGame();
        }
      }, 3000);
      this.game.intervalTimeLeft = setInterval(() => {
        this.game.timeLeft--;
      }, 1000);
    },

    playGame() {
      this.onPlay = true;
      this.reset();
      this.game = newGameDefault();
      this.removeEvents();
      const listener = (evt) => {
        if (evt.code === "Enter") {
          this.submitGame();
        }
      };
      document.addEventListener("keydown", listener);
      this.eventListeners.push({ event: "keydown", listener });
      this.startGame();
    },

    async saveGame() {
      this.game.onSaving = true;
      if (this.isCallContract) return;
      this.isCallContract = true;
      const maxScore = await this.getHighestScore();
      const score = Number(this.game.score);
      if (maxScore >= score) {
        this.isCallContract = false;
        this.game.onSaving = false;
        return;
      }
      await window.contract
        .save_new_score({ account_id: this.accountId, score })
        .finally(() => {
          this.isCallContract = false;
          this.game.onSaving = false;
        });
      this.profile.highestScore = score;
    },
    async getHighestScore() {
      if (this.profile.highestScore === -1) {
        const users = await window.contract.get_list_user({
          account_id: this.accountId,
        });
        this.profile.highestScore = users?.[0]?.score || 0;
      }
      return this.profile.highestScore;
    },

    submitGame() {
      this.reset();
      if (this.game.x + this.game.y === Number(this.game.total)) {
        this.game.score++;
        this.startGame();
      } else {
        this.game.gameOver = true;
      }

      this.game.total = "";
    },

    async access() {
      if (this.isCallContract) return;
      this.isCallContract = true;
      const res = await window.contract.check_access({
        account_id: this.accountId,
      });
      this.isCallContract = false;
      if (!res) {
        alert("Account is not granted permissions. Click `REG` to register");
        this.showHint = true;
        setTimeout(() => {
          this.showHint = false;
        }, 5000);
        return;
      }
      this.logged = true;
    },

    async grantAccess() {
      if (this.isCallContract) return;
      this.isCallContract = true;
      const res = await window.contract.grant_access({
        account_id: this.accountId,
      });
      this.isCallContract = false;
      if (!res) {
        alert("account has not been granted access to smart contract program!");
        return;
      }
      this.logged = true;
    },

    async setInfo() {
      if (!this.logged || this.isCallContract) return;
      this.isCallContract = true;
      await window.contract.set_info({
        account_id: this.accountId,
        f_name: this.profile.firstName,
        l_name: this.profile.lastName,
        age: this.profile.age,
      });
    },

    async getInfo() {
      if (!this.logged) return;
      const res = await window.contract.get_info({
        account_id: this.accountId,
      });
      let msg = "";
      Object.keys(res).forEach((key) => {
        msg += `${key.toUpperCase()}: ${res[key]} \n`;
      });
      alert(msg);
    },

    async getLeaderBoard() {
      this.leaderBoard = await window.contract.get_top_players();
      this.showLeaderBoard = true;
    },
  },

  watch: {
    logged: function (val) {
      if (val) {
        sessionStorage.setItem("accountLogged", val);
        sessionStorage.setItem("accountId", this.accountId);
      } else {
        sessionStorage.removeItem("accountLogged");
        sessionStorage.removeItem("accountId");
        this.onPlay = false;
        this.showLeaderBoard = false;
      }
    },
    onPlay() {
      this.showLeaderBoard = false;
    },
  },
};
</script>

<style>
#app {
  font-family: pixel;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1 {
  margin-top: 3em;
  margin-bottom: 1em;
}
.scene {
  height: 350px;
}
.face {
  margin: auto;
  width: 66%;
  height: 72%;
  background-color: #fffaf2;
}
.number {
  text-align: center;
  margin: auto;
  width: 66%;
  height: 28%;
  background-color: #ffd9f8;
  border-top: 5px dotted #82174d;
  font-size: 1.5rem;
}
.eyes-row {
  display: flex;
  justify-content: space-around;
  margin-top: 24%;
  padding: 0 8px;
}
.closed {
  width: 22px;
  height: 13px;
  border-top-left-radius: 100px;
  border-top-right-radius: 100px;
  border-left: 2px solid #ffa4b1;
  border-right: 2px solid #ffa4b1;
  border-top: 2px solid #ffa4b1;
  margin-bottom: 12px;
}
.eye {
  width: 26px;
  height: 26px;
  border-radius: 100px;
  background-color: #ffa4b1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1px;
}
.eye .pupil {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 100px;
  background-color: #82174d;
}
.eye .pupil:before {
  content: "";
  width: 6px;
  height: 6px;
  position: absolute;
  background-color: #fff;
  top: 4px;
  left: 3px;
  border-radius: 100px;
}
.eye .pupil:after {
  content: "";
  width: 3px;
  height: 3px;
  position: absolute;
  background-color: #fff;
  top: 9px;
  left: 12px;
  border-radius: 100px;
}
.mouth-row {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}
.mouth-row .mouth {
  margin-top: 3%;
}
.mouth-row .tongue {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #ff585d;
  border-radius: 50% 50% 30%;
  margin: 5px 0;
}
.mouth-row .mouth.smile {
  height: 16px;
  width: 32px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  background-color: #82174d;
  top: 120px;
}
.mouth-row .mouth.cry {
  height: 16px;
  width: 32px;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  background-color: #82174d;
  top: 120px;
}
.mouth-row .mouth:before {
  content: "";
  left: 43px;
  margin-top: 1%;
  border-radius: 100%;
  height: 5%;
  width: 11.5%;
  background-color: #f56f79;
  position: absolute;
}
.mouth-row .mouth:after {
  content: "";
  left: 106px;
  margin-top: 1%;
  border-radius: 100%;
  height: 5%;
  width: 11.5%;
  background-color: #f56f79;
  position: absolute;
}
.gameboy {
  position: relative;
  width: 400px;
  margin: auto;
}
.body-shape {
  position: absolute;
  height: 500px;
  width: 205px;
  border-radius: 15px;
}
.body-shape .shadow {
  height: 290px;
}
.body-shape .screen {
  margin: 20px;
  position: relative;
  width: 168px;
  height: 134px;
  background-color: #82174d;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-items: center;
}
.body-shape .dot {
  content: "";
  width: 8px;
  height: 8px;
  position: absolute;
  background-color: #ffa4b1;
  top: 40px;
  left: 10px;
  border-radius: 100px;
}
.body-shape .on {
  background-color: #f0ec74;
}
.body-shape .buttons {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
}
.body-shape .buttons .row {
  text-align: left;
  width: calc(100% - 42px);
  display: flex;
  flex-direction: column;
  padding-left: 18px;
}
.body-shape .buttons .row input {
  width: 100%;
  margin: 4px 0px 16px 0px;
  font-family: pixel;
}
.body-shape .buttons .selects {
  margin-top: 0px;
  padding-left: 114px;
}
.body-shape .buttons .arrows {
  position: relative;
  height: 40px;
  width: 40px;
  border-radius: 100px;
  background-color: #ffa4b1;
  margin-left: 30px;
  padding: 0;
  cursor: grab;
}
.body-shape .buttons .arrows:disabled {
  opacity: 0.8;
  background-color: #d18892;
}
.body-shape .buttons .arrows .updown {
  position: relative;
  height: 35px;
  width: 10px;
  background-color: #82174d;
  border-radius: 2px;
  top: -8px;
  left: 14px;
}
.body-shape .buttons .arrows .left {
  position: relative;
  width: 35px;
  height: 10px;
  background-color: #82174d;
  border-radius: 2px;
  top: 14px;
  left: 2px;
}
.body-shape .buttons .arrows .right {
  position: relative;
  width: 35px;
  height: 10px;
  background-color: #82174d;
  border-radius: 2px;
  left: 2px;
}
.body-shape .buttons .ab {
  width: 68px;
  height: 68px;
  background-color: #ffa4b1;
  border-radius: 10px;
  transform: rotate(45deg);
  font-size: 0.6rem;
  text-align: center;
  border-left: 2px solid #7a7778;
  border-bottom: 2px solid;
}
.body-shape .buttons .ab .r {
  width: 28px;
  height: 28px;
  border-radius: 100%;
  background-color: #82174d;
  position: absolute;
  transform: rotate(-45deg);
  padding: 0;
  text-align: center;
  color: #ffa4b1;
  cursor: pointer;
  box-shadow: -1px 0 1px #4b4f54;
  border-width: 0px;
  font-family: pixel;
}
.body-shape .buttons .ab .r[disabled] {
  background-color: #a76b79;
}
.body-shape .buttons .ab .r:hover {
  opacity: 0.8;
}
.body-shape .buttons .ab .r:active {
  background-color: #f0ec74;
  opacity: 1;
}
.body-shape .buttons .ab .a {
  top: 4px;
  left: 4px;
}
.body-shape .buttons .ab .b {
  top: 4px;
  left: 36px;
}
.body-shape .buttons .ab .c {
  top: 36px;
  left: 4px;
}
.body-shape .buttons .ab .d {
  top: 36px;
  left: 36px;
}
.shadow {
  background-color: #888ad0;
  z-index: 0;
  left: -17px;
  top: 26px;
}
.side {
  background-color: #82174d;
  z-index: 1;
}
.front {
  background-color: #f56f79;
  left: 26px;
  z-index: 2;
}
.loader,
.loader:before,
.loader:after {
  background: #f56f79;
  -webkit-animation: load1 1s infinite ease-in-out;
  animation: load1 1s infinite ease-in-out;
  width: 0.4rem;
  height: 4em;
}
.loader {
  color: #f56f79;
  margin: 2px auto;
  font-size: 0.2rem;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
.loader:before,
.loader:after {
  position: absolute;
  top: 0;
  content: "";
}
.loader:before {
  left: -1.5em;
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.loader:after {
  left: 1.5em;
}
@-webkit-keyframes load1 {
  0%,
  80%,
  100% {
    box-shadow: 0 0;
    height: 2em;
  }
  40% {
    box-shadow: 0 -2em;
    height: 3em;
  }
}
@keyframes load1 {
  0%,
  80%,
  100% {
    box-shadow: 0 0;
    height: 2em;
  }
  40% {
    box-shadow: 0 -2em;
    height: 3em;
  }
}
</style>
<style scoped lang="scss">
.ab__left {
  position: relative;
  left: calc(18px - 114px);
  top: 12px;

  .btn-action {
    height: 24px;
    background-color: #ffa4b1;
    border-radius: 6px;
    font-size: 0.6rem;
    font-family: pixel;
    text-align: center;
    border-top: 0;
    border-right: 0;
    text-transform: uppercase;
    color: #82174e;
    letter-spacing: 2px;

    &__rank {
      position: absolute;
      left: 0;
      top: 32px;
    }
  }

  .input-game {
    border-radius: 4px;
    border-color: gray;
    border-width: 0;
    height: 20px;
    margin: 0 !important;
  }
}

.highlight {
  background-color: green !important;
  transition: 0.3s linear;
}

@font-face {
  font-family: "pixel";
  src: url("https://dl.dropboxusercontent.com/s/hsdwvz761xqphhb/pixel.ttf")
    format("truetype");
}
</style>
