<route>{ meta: { disallowAuthed: true} }</route>

<template>
    <div class="user-wrap">
        <user-item />
        <div>
            <q-btn flat @click="chageTheme" class="">
                <Icon icon="ic:outline-brightness-4" class="on-left"/>
                테마변경
                </q-btn>
            <q-btn v-show="!launcherAuth" flat icon="mdi-logout" @click="logoutClick">로그아웃</q-btn>
        </div>
    </div>
    <div class="select-wrap">
        <div class="btn-group">
            <button class="import-evidence">
                <em class="title">새로운 분석</em>
            </button>
            <button class="analysis-evidence">
                <em class="title">분석 불러오기</em>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useQuasar } from 'quasar'
import UserItem from '@renderer/publishing/components/common/header/MenuBarUserItem.vue'

import { openConfirm } from '@renderer/composables/useDialog'
import { useStoreResetExceptSystem } from '@renderer/stores'
import { useUserStore } from '@renderer/stores/userStore'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

const router = useRouter()

const { launcherAuth } = storeToRefs(useUserStore())


/**
 * 로그아웃 버튼 클릭
 * 전체 Store 값을 초기화하고 로그인 화면으로 이동
 *
 */
async function logoutClick(): Promise<void> {
  if (!(await openConfirm('로그아웃 하시겠습니까?'))) {
    return
  }

  try {
    // 로그아웃
    await loginApi.logout()
    // Store 초기화 (시스템정보 제외)
    useStoreResetExceptSystem()
  } catch (err) {
    electronApi.logError(err)
  }

  // 화면이동
  router.push('/login')
}

// 테마 변경
const $q = useQuasar()
const chageTheme = () => {
  $q.dark.toggle()
}
</script>
<style lang="scss" scoped>
    .user-wrap {
        display: flex;
        justify-content: end;
        padding-top: 0.5rem;
        .q-btn ::v-deep {
            font-size: 0.875rem;
            &:last-child::after {
                display: none;
            }
            &::after {
                content: "";
                display: inline-block;
                width: 1px;
                height: 0.75rem;
                background-color: rgba(255, 255, 255, 30%);
                position: absolute;
                right: 0;
                top: calc(50% - 6px);
            }
        }
        .q-btn ::v-deep(.q-icon) {
            margin-right: 0.375rem;
        }
    }
    .select-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        padding: 0 1.5rem;
        padding-top: 14.6875rem;
        .btn-group {
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 101.25rem;
            gap: 3rem;
            > button {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 50%;
                max-height: 29rem;
                box-shadow: 0px 4px 16px rgba(0,0,0, 0.5);
                border-radius: 0.75rem;
                border: none;
                background: inherit;
                background-color: rgba(255,255,255, 0.07);
                position: relative;
                cursor: pointer;

                // 아이콘
                &::before {
                    content: "";
                    display: inline-block;
                    width: 13.5rem;
                    height: 13.5rem;
                    position: absolute;
                    top: 5.25rem;
                    background: url(@renderer/assets/images/ico_select_evidence.svg) no-repeat -27rem 0 / auto;
                }
                &.import-evidence {
                    &:hover::before {
                        background-position: -40.5rem 0 ;
                    }
                }
                &.analysis-evidence {
                    &::before {
                        background-position: 0 0 ;
                    }
                    &:hover::before {
                        background-position: -13.5rem 0 ;
                    }
                }
                // 그라디언트
                &::after {
                    content: "";
                    display: inline-block;
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 10;
                }
                // 버튼 hover 시
                &:hover {
                    border-bottom: 10px solid $primary;
                    &::after {
                        background: linear-gradient(to top, rgba(0, 220, 255, 100%), rgba(0, 220, 255, 10%));
                        opacity: 20%;
                    }
                    > .title {
                        color: $primary;
                        font-size: 3.75rem;
                        padding-top: 21.5625rem;
                        padding-bottom: 2rem;
                        text-shadow: 0px 4px 8px rgba(0,0,0, 35%);
                        font-weight: 700;
                    }
                }
                > .title {
                    display: inline-block;
                    font-style: normal;
                    font-size: 3rem;
                    color: #ffffff;
                    padding-top: 22.125rem;
                    padding-bottom: 2.5rem;
                    font-weight: 700;
                }
            }
        }
    }

// 화이트모드 적용
.body--light {
    .select-wrap {
        .btn-group {
            > button {
                background-color: #90A2AF;
                border: 1px solid rgba(#ffffff, 70%);
                // 아이콘
                &.import-evidence {
                    &:hover::before {
                        background-position:  -27rem 0 ;
                    }
                }
                &.analysis-evidence {
                    &::before {
                        background-position: 0 0 ;
                    }
                    &:hover::before {
                        background-position: 0 0 ;
                    }
                }
                // 그라디언트
                &::after {
                    display: none;
                }
                // 버튼 hover 시
                &:hover {
                    background-color: #2165A2;
                    border-bottom: none;
                    > .title {
                        color: #ffffff;
                        font-size: 3rem;
                        text-shadow: none;
                    }
                }
                > .title {
                    color: #ffffff;
                }
            }
        }
    }
}
</style>