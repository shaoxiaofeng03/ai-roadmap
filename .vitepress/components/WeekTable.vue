<script setup lang="ts">
import { VPLink } from 'vitepress/theme'
// 构建时由 .vitepress/config.mts 从 ROADMAP / PROGRESS / RESOURCES-VIDEOS / projects/ 汇总注入
import data from 'virtual:site-data'

const { weeks, currentWeek } = data
</script>

<template>
  <section class="week-hub">
    <h2 class="title">每周直达</h2>
    <p class="desc">
      一周的内容分散在三处：计划在 ROADMAP，视频在资源清单，教材与练习在各周学习包。这张表把它们按周拼在一起。
    </p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>周次</th>
            <th>主题</th>
            <th>周计划</th>
            <th>视频资源</th>
            <th>学习包</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in weeks" :key="w.n" :class="{ current: w.n === currentWeek }">
            <td class="week">
              <span class="num">W{{ w.n }}</span>
              <span v-if="w.n === currentWeek" class="badge">进行中</span>
              <span v-if="w.dates" class="dates">{{ w.dates }}</span>
            </td>
            <td class="theme">{{ w.title || '—' }}</td>
            <td>
              <VPLink v-if="w.plan" :href="w.plan">周计划</VPLink>
              <span v-else class="none">—</span>
            </td>
            <td>
              <VPLink v-if="w.resource" :href="w.resource.link" :title="w.resource.title">资源清单</VPLink>
              <span v-else class="none">—</span>
            </td>
            <td>
              <VPLink v-if="w.pkg" :href="w.pkg">进入学习包</VPLink>
              <span v-else class="none">待生成</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped src="./week-table.css"></style>
