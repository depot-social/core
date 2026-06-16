<template>
  <LMap
    style="height: auto"
    class="bg-base-100 min-h-full"
    :class="classNames"
    :zoom="markers.length === 1 ? 15 : 11"
    :center="centerPosition"
    :use-global-leaflet="false"
  >
    <LTileLayer
      :url="`https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`"
      attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      layer-type="base"
      name="OpenStreetMap"
    />
    <LLayerGroup v-for="(marker, i) in markers" :key="i">
      <LMarker :lat-lng="marker.point">
        <LPopup>
          <slot :index="i" />
        </LPopup>
      </LMarker>
      <LCircle
        v-if="circleRadius > 0 && marker.isObfuscated"
        :lat-lng="marker.point"
        :radius="circleRadius"
      />
    </LLayerGroup>
  </LMap>
</template>

<script setup lang="ts">
import type { Marker } from '~/base/models/map';

interface Props {
  classNames?: string;
  markers?: Marker[];
}

const props = withDefaults(defineProps<Props>(), {
  classNames: '',
  markers: () => [],
});

const centerPosition =
  props.markers.length === 0
    ? null
    : useBoundsCenter(
        props.markers.map((marker) => ({
          lat: marker.point[0],
          lng: marker.point[1],
        }))
      );

const mapboxToken = useRuntimeConfig().public.mapboxToken;
const circleRadius = Number(useRuntimeConfig().public.randomLocationRadius);
</script>

<style>
@reference '~/base/assets/css/main.css';

.leaflet-container {
  @apply font-text;
}

.leaflet-container a {
  @apply text-white;
  @apply font-sans;
}
</style>
