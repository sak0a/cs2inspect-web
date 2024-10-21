<script setup lang="ts">
import {generateSlug} from "~/server/utils/slug";

const props = defineProps({
  preloaderName: {
    type: String,
    default: generateSlug(2)
  }
})
const state = reactive({
  preloader: true
});
const preloaderStyle: string = "line-scale-pulse-out";
const revealDuration: number = 250;
const revealDelay: number = 25;
const preloaderDivsToCreate: number = 5;

function animation() {
  return [
    {transform: "scale(1)", opacity: 1},
    {transform: "scale(5)", opacity: 0},
  ];
}

onMounted(() => {
  if (sessionStorage.getItem("preload-" + props.preloaderName?.toUpperCase()) === "shown") {
    state.preloader = false;
    return;
  }
  const preloader = document.getElementById("preloader_" + preloaderStyle);
  preloader.classList.add(preloaderStyle);
  const outerWrapper = document.querySelector(".preloader_wrapper_outer");
  outerWrapper.animate(animation(), {
    duration: revealDuration,
    delay: revealDelay,
    iterations: 1,
    fill: "forwards",
    easing: "ease-in-out"
  });
  setTimeout(() => {
    outerWrapper.style.display = "none";
    state.preloader = false;
    sessionStorage.setItem("siteLoader", "shown");
  }, revealDelay + revealDuration);
});
</script>

<template>
  <div v-if="state.preloader" class="preloader_wrapper_outer">
    <div class="preloader_wrapper_inner">
      <div :id="'preloader_' + preloaderStyle" class="preloader">
        <div v-for="n in preloaderDivsToCreate" :key="n">
          <div :id="`loader-div-${n}`"/>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="sass" scoped>
.preloader_wrapper_outer
  background: #000
  display: flex
  align-items: center
  justify-content: center
  position: fixed
  top: 0
  left: 0
  width: 100vw
  height: 100vh
  z-index: 10000000
  animation-timing-function: ease

.preloader_wrapper_outer .preloader.line-scale-pulse-out > div
  background-color: #fff

.line-scale-pulse-out > div
  width: 4px
  height: 35px
  display: inline-block
  border-radius: 2px
  margin: 2px
  background-color: #fff
  -webkit-animation: line-scale-pulse-out 0.9s -0.6s infinite cubic-bezier(0.85, 0.25, 0.37, 0.85)
  animation: line-scale-pulse-out 0.9s -0.6s infinite cubic-bezier(0.85, 0.25, 0.37, 0.85)

.line-scale-pulse-out > div:nth-child(2),
.line-scale-pulse-out > div:nth-child(4)
  -webkit-animation-delay: -0.4s !important
  animation-delay: -0.4s !important


.line-scale-pulse-out > div:nth-child(1),
.line-scale-pulse-out > div:nth-child(5)
  -webkit-animation-delay: -0.2s !important
  animation-delay: -0.2s !important
@-webkit-keyframes line-scale-pulse-out
  0%, 100%
    transform: scaley(1)
  50%
    transform: scaleY(0.4)


@keyframes line-scale-pulse-out
  0%, 100%
    transform: scaleY(1)
  50%
    transform: scaleY(0.4)
</style>