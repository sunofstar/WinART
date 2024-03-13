<template>
    <div class="side-wrap">
      <ul class="side">
        <li class="">
          <a href="#" class="one-depth depth">
            <span>Registry (2,116)</span>
            <Icon icon="mdi:chevron-up" color="white" />
          </a>
          <ul>
              <li class="">
                <a href="#" class="two-depth depth active">
                  <span>System Information<strong>(876)</strong></span>
                </a>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>프로그램 실행 <strong>(1,238)</strong></span>
                  <Icon icon="ic:sharp-arrow-left" color="white" :rotate="1" />
                </a>
                <ul>
                  <li class="three-depth-wrap">
                    <a href="#" class="three-depth depth">
                      <span>USERAssist <strong>(1,230)</strong></span>
                    </a>
                    <a href="#" class="three-depth depth">
                      <span>BamDam <strong>(5)</strong></span>
                    </a>
                  </li>
                </ul>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>사용자 계정 <strong>(2)</strong></span>
                  <Icon icon="ic:sharp-arrow-left" color="white" :rotate="3" />
                </a>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>Timezone <strong>(1)</strong></span>
                </a>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>장치 흔적</span>
                </a>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>파일 폴더 접근</span>
                </a>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>네트워크</span>
                </a>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>입력 또는 검색</span>
                </a>
              </li>
              <li class="">
                <a href="#" class="two-depth depth">
                  <span>설치목록</span>
                </a>
              </li>
          </ul>
        </li>
        <li class="">
          <a href="#" class="one-depth depth">
            <span>FileSystem <strong>(10)</strong></span>
            <Icon icon="mdi:chevron-up" color="white" :rotate="2"/>
          </a>
        </li>
        <li class="">
          <a href="#" class="one-depth depth">
            <span>EventLogs <strong>(3)</strong></span>
            <Icon icon="mdi:chevron-up" color="white" :rotate="2"/>
          </a>
        </li>
        <li class="">
          <a href="#" class="one-depth depth">
            <span>FileFolderAccess <strong>(2)</strong></span>
            <Icon icon="mdi:chevron-up" color="white" :rotate="2"/>
          </a>
        </li>
        <li class="">
          <a href="#" class="one-depth depth">
            <span>ProgramExecution <strong>(4)</strong></span>
            <Icon icon="mdi:chevron-up" color="white" :rotate="2"/>
          </a>
        </li>
        <li class="">
          <a href="#" class="one-depth depth">
            <span>FileDeletion <strong>(1)</strong></span>
            <Icon icon="mdi:chevron-up" color="white" :rotate="2"/>
          </a>
        </li>
        <li class="">
          <a href="#" class="one-depth depth">
            <span>SRUMDatabase <strong>(5)</strong></span>
            <Icon icon="mdi:chevron-up" color="white" :rotate="2"/>
          </a>
        </li>
        <li class="">
          <a href="#" class="one-depth depth">
            <span>BrowsingHistory <strong>(8)</strong></span>
            <Icon icon="mdi:chevron-up" color="white" :rotate="2"/>
          </a>
        </li>
      </ul>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const count = ref("123")

import { Icon } from '@iconify/vue'
</script>

<style lang="scss" scoped>
.side-wrap {
  width: 25rem;
    color: #FFF;
    background-color: #101214;
    overflow-y: auto;
  ul, li {
    text-decoration: none;
    padding: 0;
    color: #fff;
    font-size: 16px;
    margin: 0;
    .depth {
      display: inline-block;
      color: #fff;
      text-decoration: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .iconify {
        width: 1.5rem;
        height: 1.5rem;
      }
    }
  }
  
  .one-depth {
    width: 100%;
    padding: 0.75rem 1.25rem;
    font-weight: 700;
    background-color: rgba(245, 250, 255, 0.2);
    margin-bottom: 1px;
  }
  .two-depth {
      width: 100%;
      padding: 0.5rem 1.25rem 0.5rem 1.875rem;
      font-weight: 700;
      background-color: rgba(245, 250, 255, 0.1);
      margin-bottom: 1px;
      &.active {
        background: linear-gradient(to right, rgba(20, 215, 200, 0.5) 0%, rgba(100, 100, 100, 0.15) 100%) !important;
      }
    }
  .three-depth-wrap {
    padding: 0.375rem 0;
    .three-depth {
      width: 100%;
      padding: 0.375rem 1.25rem 0.375rem 2.875rem;
      font-size: 0.9375rem;
      &.active {
        color: $primary;
      }
    }
  }
}
</style>