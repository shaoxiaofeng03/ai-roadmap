<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import WeekTable from '../components/WeekTable.vue'

// 复用默认主题，只在首页功能区下方追加「每周直达」
const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-features-after>
      <WeekTable />
    </template>
  </Layout>
</template>
