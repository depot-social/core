<template>
  <div v-if="state.pagination.pageCount >= 2" class="col-span-full text-center">
    <div class="join">
      <button
        v-for="i in pageNumbers"
        :key="i"
        :class="[
          'join-item btn btn-neutral text-sm b-0',
          state.pagination.page === i && 'btn-active',
        ]"
        :title="$t('goToPage', { page: i })"
        @click="setPage(i)"
      >
        {{ i }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  state: {
    pagination: {
      page: number;
      pageCount: number;
    };
  };
  setPage: (page: number) => void;
}

const props = defineProps<Props>();

const pageNumbers = computed(() =>
  Array.from(Array(props.state.pagination.pageCount).keys()).map((i) => i + 1)
);
</script>
