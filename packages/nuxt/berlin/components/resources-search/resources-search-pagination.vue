<template>
  <div
    v-if="state.pagination.pageCount >= 2"
    class="grid lg:grid-cols-[1fr_341px] 2xl:grid-cols-[1fr_440px] gap-8 md:gap-4 px-2"
  >
    <nav
      class="flex flex-col md:flex-row items-center justify-start mb-6 px-3"
      aria-label="Pagination"
    >
      <div class="flex items-center gap-y-2">
        <button
          :disabled="state.pagination.page <= 1"
          :class="[
            'px-3 py-2 font-semibold text-base md:text-2lg rounded-lg',
            state.pagination.page <= 1
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-gray-200',
          ]"
          type="button"
          :aria-disabled="state.pagination.page <= 1"
          aria-label="Vorherige page"
          @click="handlePageClick(state.pagination.page - 1)"
        >
          ←
        </button>

        <div class="flex items-center gap-y-1" role="list">
          <button
            v-for="item in pageNumbers"
            :key="item.type === 'page' ? item.value : `ellipsis-${item.value}`"
            :class="[
              'font-semibold text-base md:text-2lg cursor-pointer',
              item.type === 'page'
                ? 'w-8 md:w-12 aspect-square rounded-lg'
                : 'w-6 md:w-8 pointer-events-none',
              item.type === 'page' &&
                state.pagination.page === item.value &&
                'bg-gray-400',
            ]"
            :aria-label="
              item.type === 'page'
                ? `${
                    state.pagination.page === item.value
                      ? 'Aktuelle Seite, '
                      : ''
                  }Seite ${item.value}`
                : 'Mehr Seiten'
            "
            :aria-current="
              item.type === 'page' && state.pagination.page === item.value
                ? 'page'
                : undefined
            "
            :disabled="item.type === 'ellipsis'"
            :aria-disabled="item.type === 'ellipsis'"
            role="listitem"
            @click="item.type === 'page' && handlePageClick(item.value)"
          >
            {{ item.type === 'page' ? item.value : '...' }}
          </button>
        </div>

        <button
          :disabled="state.pagination.page >= state.pagination.pageCount"
          :class="[
            'px-3 py-2 font-semibold text-base md:text-2lg rounded-lg',
            state.pagination.page >= state.pagination.pageCount
              ? 'opacity-40 cursor-not-allowed'
              : 'cursor-pointer hover:bg-gray-200',
          ]"
          :aria-disabled="state.pagination.page >= state.pagination.pageCount"
          aria-label="Nächste Seite"
          @click="handlePageClick(state.pagination.page + 1)"
        >
          →
        </button>
      </div>

      <div class="sr-only" aria-live="polite" aria-atomic="true">
        Seite {{ state.pagination.page }} von {{ state.pagination.pageCount }}
      </div>
    </nav>
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

type PageItem =
  | { type: 'page'; value: number }
  | { type: 'ellipsis'; value: number };

const pageNumbers = computed<PageItem[]>(() => {
  const current = props.state.pagination.page;
  const total = props.state.pagination.pageCount;

  // If 7 or fewer pages, show all
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      type: 'page' as const,
      value: i + 1,
    }));
  }

  const pages: PageItem[] = [];

  // Always show first page
  pages.push({ type: 'page', value: 1 });

  // Near the beginning (pages 1-4)
  if (current <= 4) {
    for (let i = 2; i <= 5; i++) {
      pages.push({ type: 'page', value: i });
    }
    pages.push({ type: 'ellipsis', value: -1 });
  }
  // Near the end (last 4 pages)
  else if (current >= total - 3) {
    pages.push({ type: 'ellipsis', value: -1 });
    for (let i = total - 4; i <= total - 1; i++) {
      pages.push({ type: 'page', value: i });
    }
  }
  // In the middle
  else {
    pages.push({ type: 'ellipsis', value: -1 });
    pages.push({ type: 'page', value: current - 1 });
    pages.push({ type: 'page', value: current });
    pages.push({ type: 'page', value: current + 1 });
    pages.push({ type: 'ellipsis', value: -2 });
  }

  // Always show last page
  pages.push({ type: 'page', value: total });

  return pages;
});

const handlePageClick = async (page: number) => {
  props.setPage(page);
  await nextTick();

  // if (import.meta.client) {
  //   document
  //     .getElementById('resources')
  //     ?.scrollIntoView({ behavior: 'smooth' });
  //   // window.scrollTo({ top: 0, behavior: 'auto' });
  // }
};
</script>
