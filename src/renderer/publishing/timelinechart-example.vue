<template>
  <div class="timeline-chart-wrap">
    <div id="eventdrops-demo" class="eventdrops-demo" style="max-width: 1520px"></div>
    <!-- <div class="chart-bot">
            <p class="count">건수 :
                <span id="numberCommits" class="mx-2">{{ numberCommits }}</span> 건
            </p>
            <span>/</span>
            <p class="date">
                기간 :
                <span id="zoomStart" class="ml-2">{{ zoomStart }}</span>
                <span class="light mx-2">부터 </span>
                <span id="zoomEnd">{{ zoomEnd }}</span>
                <span class="light ml-2">까지</span>
            </p>
        </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import * as d3 from 'd3';
import * as d3 from 'd3/build/d3'
import krLocale from 'd3/node_modules/d3-time-format/locale/ko-KR.json'
import eventDrops from 'event-drops'

const repositories = [
  {
    name: 'Registry',
    commits: [
      {
        sha: '1111',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 15:03:41 +0100'
      },
      {
        sha: '22dsfafaf322',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Thu, 2 Mar 2017 00:28:06 +0100'
      },
      {
        sha: '22242423423sfsd4232',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 1 Mar 2017 17:47:28 +0100'
      },
      {
        sha: '222424234232312344232',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 28 Feb 2017 15:00:55 +0100'
      },
      {
        sha: '2224242342gfdgs232312344232',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 17 May 2017 15:44:01 +0200'
      },
      {
        sha: '22242412eefdsv2342gfdgs232312344232',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 May 2017 16:48:39 +0200'
      },
      {
        sha: '22242412eefdsv2342gfdgs232312344fdfs232',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 24 May 2017 10:25:10 +0200'
      }
    ]
  },
  {
    name: 'FileSystem',
    commits: [
      {
        sha: '3dfsdf333',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 18 Sep 2017 17:03:33 +0200'
      },
      {
        sha: '4443534544',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 8 Feb 2017 18:15:31 +0100'
      },
      {
        sha: '4443534523244',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 18 Sep 2017 17:04:00 +0200'
      },
      {
        sha: '44435345432423',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Fri, 20 Oct 2017 22:23:14 +0200'
      },
      {
        sha: '444353454fgdgs4',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Sat, 28 Jan 2017 21:52:40 +0100'
      },
      {
        sha: '4443534524fgd23232gs4',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 6 Mar 2017 18:22:16 +0100'
      },
      {
        sha: '444353454fgdgsfgdsgd',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 28 Feb 2017 17:25:35 +0000'
      },
      {
        sha: '444353454fgdg34242235s4',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 27 Feb 2017 17:46:32 +0100'
      }
    ]
  },
  {
    name: 'EventLogs',
    commits: [
      {
        sha: '5555',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 14 Mar 2017 14:04:06 +0100'
      },
      {
        sha: '6666',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Thu, 20 Apr 2017 17:42:42 +0200'
      },
      {
        sha: '632423423666',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 25 Jan 2017 17:22:31 +0000'
      },
      {
        sha: '6665647386',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 20 Jun 2017 18:12:53 +0200'
      },
      {
        sha: '666345782226',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 28 Aug 2017 18:35:09 +0200'
      },
      {
        sha: '666345782226',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Fri, 3 Feb 2017 14:02:49 +0100'
      },
      {
        sha: '662216345782226',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Sat, 4 Feb 2017 05:39:54 +0100'
      }
    ]
  },
  {
    name: 'FileFolderAccess',
    commits: [
      {
        sha: '7777',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 30 Jan 2017 18:26:21 +0100'
      },
      {
        sha: '777sfsaf7',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 30 Jan 2017 18:06:21 +0100'
      },
      {
        sha: '77fsdfasdc7',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 30 Jan 2017 16:16:21 +0100'
      },
      {
        sha: '8888',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Fri, 5 Jan 2018 18:07:55 +0100'
      },
      {
        sha: '888343668',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 7 Feb 2017 10:12:35 +0100'
      },
      {
        sha: '82342345888',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 7 Feb 2017 08:51:15 +0100'
      },
      {
        sha: '8886456358',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 7 Feb 2017 10:28:13 +0100'
      },
      {
        sha: '8234234234888',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 7 Feb 2017 16:43:40 +0100'
      },
      {
        sha: '82342342348231238',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 17 Jan 2017 14:43:15 +0100'
      },
      {
        sha: '82342342342342342388',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 17 Jan 2017 16:57:33 +0100'
      }
    ]
  },
  {
    name: 'ProgramExecution',
    commits: [
      {
        sha: '9232fsdfsdaf4999',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 18:03:41 +0100'
      },
      {
        sha: '101fasfasf234v423sadsfg0',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 24 May 2017 14:38:13 +0200'
      },
      {
        sha: '10123fasdfa4423dsfasdf0',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Mon, 22 May 2017 09:50:24 +0200'
      },
      {
        sha: '1012rqr34423dsfasdf0',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:03:41 +0100'
      },
      {
        sha: '101sdfs2rqr34fasdfas4230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:02:41 +0100'
      },
      {
        sha: '1012rqr3sfsdf44230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 11:03:41 +0100'
      },
      {
        sha: '1012rqr344sfsdf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:05:41 +0100'
      },
      {
        sha: '1012rqr344sfdfsdf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:01:41 +0100'
      },
      {
        sha: '1012rqr344sfsdaff230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:00:41 +0100'
      },
      {
        sha: '1012rqr344sfsdf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:22:41 +0100'
      },
      {
        sha: '1012rqr344sfsddfsdf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:11:41 +0100'
      },
      {
        sha: '1012rqr344sfsdfaf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 11:12:41 +0100'
      },
      {
        sha: '1012darqr344sfsdf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 12:12:41 +0100'
      },
      {
        sha: '10sd2rqr344sfsdf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 19:12:41 +0100'
      },
      {
        sha: '10df12rqr34gab34sfsdf230',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 10:12:41 +0100'
      },
      {
        sha: '10d12343442sd323213sadfsdf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 17:19:05 +0200'
      },
      {
        sha: '10dsf1234344233sadfsdf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 11:19:05 +0200'
      },
      {
        sha: '10d1dfsvadfsdf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 19:19:05 +0200'
      },
      {
        sha: 's20d123a43sdsadfsdf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 19:50:05 +0200'
      },
      {
        sha: '10d1fdsfv2323124fsdf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 19:56:05 +0200'
      },
      {
        sha: '10d1fsdfasdf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 20:56:05 +0200'
      },
      {
        sha: '10dfsaf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 19:36:05 +0200'
      },
      {
        sha: '113441f120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 22:46:05 +0200'
      },
      {
        sha: '1dfsf13441f120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 22:33:05 +0200'
      },
      {
        sha: '1dfsf1dasf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 22:39:05 +0200'
      },
      {
        sha: '1dfsf1dasdf20',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 22:39:00 +0200'
      },
      {
        sha: '1sdf24256asdf20',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 02:39:00 +0200'
      },
      {
        sha: '143673245df20',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 12:39:00 +0200'
      },
      {
        sha: '10sd1234342323fsdf120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 18:19:05 +0200'
      },
      {
        sha: '10d123dsdsfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 13:20:05 +0200'
      },
      {
        sha: '10d123dsfsbv21120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 16:18:05 +0200'
      },
      {
        sha: '1gsdv3dsfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 16:11:05 +0200'
      },
      {
        sha: '1012113dsfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 16:09:05 +0200'
      },
      {
        sha: '1012113dssfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 14:09:05 +0200'
      },
      {
        sha: 'dsfsdv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 19:19:05 +0200'
      },
      {
        sha: '101a2113dsfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 12:19:05 +0200'
      },
      {
        sha: '112113dsfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 12:09:05 +0200'
      },
      {
        sha: '1gsae3dsfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 12:22:05 +0200'
      },

      {
        sha: '1s113sdsfsbv2120',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 30 May 2017 12:23:05 +0200'
      }
    ]
  },
  {
    name: 'FileDeletion',
    commits: [
      {
        sha: '2422423432',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 16 May 2017 16:45:56 +0200'
      },
      {
        sha: '242242dfsf3432',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 18:16:18 +0200'
      },
      {
        sha: '22456362d422423432',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Fri, 12 May 2017 11:07:21 +0200'
      },
      {
        sha: '54352s342345',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 10:36:08 +0200'
      },
      {
        sha: '54d352ss342345',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 11:36:08 +0200'
      },
      {
        sha: '5dvb2ss342345',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 12:36:08 +0200'
      },
      {
        sha: '54232352342345',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 11:02:08 +0200'
      },
      {
        sha: '542dv342341215',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 11:04:08 +0200'
      },
      {
        sha: 'dfsvae2342345',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 11:12:08 +0200'
      },
      {
        sha: 'dfssdvadedfasv2342345',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 11:00:08 +0200'
      },
      {
        sha: 'sdfsvae23423adfsasf45',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 11:35:08 +0200'
      },
      {
        sha: 'sdfsfasfvae23423adfsasf45',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 11:30:08 +0200'
      },
      {
        sha: 'sdfsvae2dfsas2asf45',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 18:25:08 +0200'
      },
      {
        sha: 'sdffsdf22asf45',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 18:55:08 +0200'
      }
    ]
  },
  {
    name: 'SRUMDatabase',
    commits: [
      {
        sha: '1435324532451111',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 23 Jan 2018 19:03:41 +0100'
      },
      {
        sha: '1145311243234534525362',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 10 May 2017 10:02:05 +0200'
      },
      {
        sha: '1145311243234534525362',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 3 May 2017 16:29:51 +0200'
      },
      {
        sha: '1145311243234534525362',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Tue, 9 May 2017 15:59:31 +0200'
      }
    ]
  },
  {
    name: 'BrowsingHistory',
    commits: [
      {
        sha: '453453426345235fsf1',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 3 May 2017 11:27:42 +0200'
      },
      {
        sha: '34536234sfsdf5ff',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 3 May 2017 16:29:51 +0200'
      },
      {
        sha: '3453dfsdf5dff2',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 3 May 2017 16:17:59 +0200'
      },
      {
        sha: '34234s23243rffsdf52',
        info: {
          OS: 'Window 10',
          buildNum: '19.1.1'
        },
        date: 'Wed, 3 May 2017 15:08:03 +0200'
      }
    ]
  }
]
const numberCommits = ref(0)
const zoomStart = ref('')
const zoomEnd = ref('')
const dateFormat = d3.timeFormat('%Y-%m-%d %I:%M')

// 데이터
const repositoriesData = repositories.map((repository) => ({
  name: repository.name,
  data: repository.commits
}))

// 데이터 업데이트
const updateCommitsInformation = (chart) => {
  const filteredData = chart.filteredData().reduce((total, repo) => total.concat(repo.data), [])

  numberCommits.value = filteredData.length
  zoomStart.value = dateFormat(chart.scale().domain()[0])
  zoomEnd.value = dateFormat(chart.scale().domain()[1])
}

// 라벨 컬러값
let myColor = ['#65C2A5', '#FC8D62', '#8DA0CB', '#E78AC3', '#8AC32B', '#DDB908', '#B981E1', '#6BA8F0']

// 툴팁
const tooltip = d3
  .select('body')
  .append('div')
  .classed('timeline-tooltip', true)
  .style('opacity', 0)
  .style('pointer-events', 'auto')

// 차트
const chart = eventDrops({
  d3,
  locale: krLocale,
  bound: {
    format: d3.timeFormat('%Y-%m-%d')
  },
  metaballs: {
    blurDeviation: 10,
    colorMatrix: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 50 -10'
  },
  axis: {
    formats: {
      milliseconds: '%L',
      seconds: ':%S',
      minutes: '%I:%M',
      hours: '%I %p',
      days: '%a %d',
      weeks: '%b %d',
      months: '%B',
      year: '%Y'
    },
    verticalGrid: false,
    tickPadding: 6
  },
  drops: (row) => row.data,
  drop: {
    // 데이터 색깔 null이면 라벨과 동일
    color: null,

    date: (d) => new Date(d.date),
    radius: 5,

    // 툴팁 마우스오버
    onMouseOver: (commit) => {
      tooltip.transition().duration(100).style('opacity', 1).style('pointer-events', 'auto')

      tooltip
        .html(
          `<div class="commit">
                    <div class="content">
                        <h3 class="date">${dateFormat(new Date(commit.date))}</h3>
                        <p>
                            <strong class="os"><span>- OS 정보 : </span>${commit.info.OS}</strong>
                            <strong class="buildNum"><span>- 빌드 번호 : </span>${commit.info.buildNum}</strong>
                        </p>
                        <a href="#" class="more-view">더보기</a>
                    </div>
                </div>`
        )
        .style('left', `${d3.event.pageX - 30}px`)
        .style('top', `${d3.event.pageY + 20}px`)
    },
    onMouseOut: () => {
      tooltip.transition().duration(500).style('opacity', 0).style('pointer-events', 'none')
    }
  },
  label: {
    padding: 20,
    text: (d) => `${d.name} (${d.data.length})`,
    width: 200
  },
  indicator: {
    previousText: '◀',
    nextText: '▶'
  },
  line: {
    // color: (_, index) => d3.schemeCategory10[index],
    color: (_, index) => myColor[index],
    height: 42
  },
  margin: {
    top: 30,
    right: 10,
    bottom: 10,
    left: 10
  },
  range: {
    start: new Date(new Date().getTime() - 3600000 * 24 * 365 * 5), // 5 years ago
    end: new Date()
  },
  zoom: {
    onZoomStart: null,
    onZoom: null,
    onZoomEnd: () => updateCommitsInformation(chart),
    minimumScale: 0,
    maximumScale: Infinity
  },
  numberDisplayedTicks: {
    small: 3,
    medium: 5,
    large: 7,
    extra: 12
  },
  breakpoints: {
    small: 576,
    medium: 768,
    large: 992,
    extra: 1200
  }
})

onMounted(() => {
  d3.select('#eventdrops-demo').data([repositoriesData]).call(chart)

  updateCommitsInformation(chart)
})
</script>

<style lang="scss">
// 차트레이아웃 및 색상
.timeline-chart-wrap {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding-top: 3rem;
  .eventdrops-demo {
    width: 100%;
    height: 100%;
    .line-label {
      font-size: 0.9375rem !important;
    }
  }
  .axis {
    stroke: #fff;
  }
  .domain {
    stroke: #fff;
  }
  .tick > line {
    stroke: #fff;
  }
  .bound.start,
  .bound.end {
    fill: #fff;
  }
  .line-label {
    font-weight: bold;
    font-size: 14px;
  }
}

// 툴팁
.timeline-tooltip {
  position: absolute;
  z-index: 9999;
  padding: 1.5rem 1.25rem;
  width: auto;
  min-width: 20rem;
  border-radius: 0.75rem;
  border: 3px solid #42464a;
  background-color: #1e2022;
  box-sizing: border-box;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 50%);
  &::before {
    content: '';
    display: block;
    position: absolute;
    top: -0.4rem;
    width: 10px;
    height: 10px;
    background: #fff;
    border: 1px solid #e7e7e7;
    border-width: 1px 0 0 1px;
    transform: rotate(45deg);
    z-index: 10000;
    background-color: #1e2022;
    border-color: #42464a;
    border-top-width: 3px;
    border-left-width: 3px;
    top: -0.5rem;
    left: 2.75rem;
    width: 12px;
    height: 12px;
  }
  .commit {
    .content {
      .date {
        font-size: 1rem !important;
        font-weight: 400 !important;
        color: #00dcff;
        padding-bottom: 8px;
      }
      p {
        margin: 0px;
        strong {
          display: block;
          font-weight: 400;
          color: #fff;
          font-size: 0.9375rem;
        }
      }
      .more-view {
        display: inline-block;
        color: #fff;
        text-decoration: none;
        padding: 0px 1rem;
        height: 36px;
        line-height: 36px;
        border: 1px solid #fff;
        border-radius: 0.25rem;
        margin-top: 1.25rem;
        font-size: 0.9375rem;
      }
    }
  }
}

// 하단
// .chart-bot {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     p {
//     padding: 10px;
//     }
// }
</style>
