<route>{ meta: { disallowAuthed: true} }</route>

<template>
    <div class="user-wrap">
        <user-item />
        <div>
            <q-btn flat @click="chageTheme" class="">
                <Icon icon="ic:outline-brightness-4" class="on-left"/>
                테마변경
                </q-btn>
            <q-btn flat icon="mdi-logout" @click="logoutClick">로그아웃</q-btn>
        </div>
    </div>
    <div class="case-wrap">
            <div class="top">
                <ul class="process">
                    <li class="row items-center process-item">
                        <span :class="{active : isActive}" class="circle">1</span>
                        <span>케이스 생성</span>
                    </li>
                    <li class="row process-item items-center">
                        <span class="circle">2</span>
                    </li>
                </ul>
            </div>
            <div class="container">
                <div class="main">
                    <div class="tbl-wrap">
                        <table>
                            <caption>분석대상</caption>
                            <colgroup>
                                <col width="9.6%" />
                                <col width="*" />
                            </colgroup>
                            <tbody>
                                <tr>
                                <th>케이스명</th>
                                <td>
                                    <q-input  
                                        v-model="text1" 
                                        outlined
                                        type="text"
                                        maxlength="50"
                                        dense
                                        clearable
                                        clear-icon="mdi-close"
                                    />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <q-separator></q-separator>
                    <div class="tbl-wrap">
                        <table>
                            <caption>분석관 정보</caption>
                            <colgroup>
                                <col width="9.6%" />
                                <col width="37.31%" />
                                <col width="*" />
                                <col width="37.31%" />
                            </colgroup>
                            <tbody>
                                <tr>
                                    <th>소속기관</th>
                                    <td>
                                        <q-input  
                                        v-model="text2" 
                                        outlined
                                        type="text"
                                        maxlength="50"
                                        dense
                                        clearable
                                        clear-icon="mdi-close"
                                    />
                                    </td>
                                    <th class="space">
                                        소속부서
                                    </th>
                                    <td>
                                        <q-input  
                                        v-model="text3" 
                                        outlined
                                        type="text"
                                        maxlength="50"
                                        dense
                                        clearable
                                        clear-icon="mdi-close"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <th>분석관명</th>
                                    <td>
                                        <q-input  
                                        v-model="text4" 
                                        outlined
                                        type="text"
                                        maxlength="50"
                                        dense
                                        clearable
                                        clear-icon="mdi-close"
                                        />
                                    </td>
                                    <th class="space">
                                        직급
                                    </th>
                                    <td>
                                        <q-input  
                                        v-model="text5" 
                                        outlined
                                        type="text"
                                        maxlength="50"
                                        dense
                                        clearable
                                        clear-icon="mdi-close"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <th>저장경로</th>
                                    <td colspan="3">
                                        <div class="d-flex-row">
                                            <q-input  
                                                v-model="text6" 
                                                outlined
                                                type="text"
                                                maxlength="50"
                                                dense
                                                clearable
                                                clear-icon="mdi-close"
                                                readonly
                                                class=""
                                            />
                                            <q-btn
                                                outline
                                                icon="mdi-folder-open-outline"
                                                label="폴더 선택"
                                                color="primary"
                                                class=""
                                                @click=""
                                            ></q-btn>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <footer class="footer-default">
                    <q-card-actions class="no-padding">
                        <q-btn outline icon="mdi-chevron-left" label="이전" @click=""></q-btn>
                        <q-space></q-space>
                        <!-- 비활성화 버튼 -->
                        <!-- <q-btn outline icon-right="mdi-chevron-right" disable label="다음" color="primary"></q-btn> -->
                        <!-- 비활성화 버튼 -->
                        <q-btn outline icon-right="mdi-chevron-right" label="다음" color="primary" @click=""></q-btn>
                    </q-card-actions>
                </footer>
            </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, Ref } from 'vue'
import { Icon } from '@iconify/vue'
import UserItem from '@renderer/publishing/components/common/header/MenuBarUserItem.vue'

const isActive = ref(true)

const text1 = ref('2023지원0000_한국기업_DDD팀_김한국')
const text2 = ref('서울북부지방검찰청')
const text3 = ref('형사5부')
const text4 = ref('홍길동')
const text5 = ref('수사관')
const text6 = ref(`D:\\CASE_NAME\\`)
</script>



<style lang="scss" scoped>
    .user-wrap {
        display: flex;
        justify-content: end;
        align-items: center;
        padding-top: 0px;
        height: 3.1875rem;
        .q-btn :deep {
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
        .q-btn :deep(.q-icon) {
            margin-right: 0.375rem;
        }
    }

    .case-wrap {
        height: calc(100% - 3.1875rem);
        width: 100%;
        > .top {
            width: 100%;
            margin: 0 auto;
            border: 1px solid #0A141E;
            height: 3.75rem;
            .process {
                display: flex;
                justify-content: center;
                align-items: center ;
                list-style: none;
                padding: 0;
                &-item {
                    span:last-child {
                        font-weight: 700;
                    }
                    &:first-child::after {
                        display: inline-block;
                        content: "";
                        width: 8px;
                        height: 1px;
                        background-color: #54585c;
                        margin: 0 12px;
                    }
                    .circle {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-radius: 50%;
                    width: 1.75rem;
                    height: 1.75rem;
                    background-color: #999999;
                    font-size: 0.9375rem;
                    font-weight: 700;
                    }
                    .circle.active {
                        background-color: #45C9FF;
                        margin-right: 0.5rem;
                    }
                }
            }
        }
        .container {
            height: calc(100% - 3.75rem);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background-color: rgba(#f5faff, 10%);
            .main {
                overflow-y: auto;
                padding: 0px 1.25rem  0px 1.25rem;
                .tbl-wrap {
                    padding-bottom: 0.625rem;
                    table {
                        border-collapse: separate;
                        border-spacing: 0 0.625rem;
                        caption {
                            font-size: 1.25rem;
                            font-weight: 700;
                            text-align: left;
                            color: $primary;
                            padding-top: 1.25rem;
                        }
                        tr {
                            &:last-child {
                                padding-bottom: 0px;
                            }
                            th {
                                text-align: left;
                                &.space {
                                    padding-left: 7.375rem;
                                }
                            }
                        }
                    }
                }
            }
        }
        
    }
</style>