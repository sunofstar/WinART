import { isObject } from 'lodash'

class ResizableTable {
  table: any
  pageX?: number | undefined
  curCol?: any | undefined
  nxtCol?: any | undefined
  curColWidth?: number | undefined
  offsetWidth?: number | undefined
  nxtColWidth?: number | undefined
  divs: HTMLDivElement[]

  constructor(table) {
    this.table = table
    this.pageX = undefined
    this.curCol = undefined
    this.nxtCol = undefined
    this.curColWidth = undefined
    this.offsetWidth = undefined
    this.nxtColWidth = undefined
    this.divs = []
    this.resizableTable(table)
  }
  resizableTable(table: any) {
    const rows = this.table.getElementsByTagName('tr'),
      cols = rows[0] ? rows[0].children : undefined
    if (!cols) return

    // table.style.overflow = 'hidden'

    const tableHeight = this.table.offsetHeight

    for (let row = 0; row < rows.length; ++row) {
      const cols = rows[row] ? rows[row].children : []
      for (let col = 0; col < cols.length; ++col) {
        if (row === 0) {
          if (col == 0) {
            // 컬럼 width값 초기화
            // 1. 같은 테이블에서 페이지네이션 이동 때에는 변경한 width값을 유지한다.
            // 2. 테이블이 변경되어 카테고리가 변경되었을 때에는 width값을 초기화한다.
            cols[col].style.width = '70px'
          } else {
            if (col == 1) {
              cols[col].style.width = '70px'
            } else {
              cols[col].style.width = '200px'
            }
            const div = this.createDiv(tableHeight)
            this.divs.push(div)
            const divs = cols[col].querySelector('div')
            if (!divs) {
              cols[col].appendChild(div)
              this.setListeners(div)
            }
          }
        }
        cols[col].style.whiteSpace = 'nowrap'
        cols[col].style.textOverflow = 'ellipsis'
        // cols[col].style.overflow = 'hidden'
      }
    }
  }
  setListeners(div: HTMLDivElement) {
    div.addEventListener('mousedown', (e) => this.onMouseDown(e))
    div.addEventListener('mouseover', (e) => this.onMouseOver(e))
    document.addEventListener('mouseout', (e) => this.onMouseOut(e))
    div.addEventListener('click', (e) => this.onClick(e))
    document.addEventListener('mousemove', (e) => this.onMouseMove(e))
    document.addEventListener('mouseup', (e) => this.onMouseUp(e))
  }

  removeListener(div: HTMLDivElement) {
    div.removeEventListener('mousedown', (e) => this.onMouseDown(e))
    div.removeEventListener('mouseover', (e) => this.onMouseOver(e))
    div.removeEventListener('click', (e) => this.onClick(e))
    document.removeEventListener('mouseout', (e) => this.onMouseOut(e))
    document.removeEventListener('mousemove', (e) => this.onMouseMove(e))
    document.removeEventListener('mouseup', (e) => this.onMouseUp(e))
  }
  clearState() {
    this.pageX = undefined
    this.curCol = undefined
    this.nxtCol = undefined
    this.curColWidth = undefined
    this.offsetWidth = undefined
    this.nxtColWidth = undefined
  }
  onMouseUp(e: MouseEvent): any {
    this.clearState()
    e.stopPropagation()
    e.preventDefault()
  }
  onMouseMove(e: MouseEvent): any {
    if (this.curCol) {
      //console.log(this.curCol)
      const diffX = e.pageX - this.pageX!
      /* if (this.nxtCol) {
        this.nxtCol.width = `${this.nxtColWidth! - diffX}px`
      }*/
      console.log(this.curCol)
      console.log(this.curCol.style)

      //this.curCol.setProperty('width', `${this.curColWidth! + diffX}px`)
      const colwidth = this.curColWidth! + diffX
      if (colwidth > 40) this.curCol.style.width = `${colwidth}px`
      //console.log(this.curCol.style.width)
    }
  }

  removeListeners() {
    this.divs.forEach((div) => this.removeListener(div))
  }
  onClick(e: MouseEvent): any {
    e.stopPropagation()
  }
  onMouseOut(e: MouseEvent): any {
    //console.log('onMouseOut', e)
  }
  onMouseOver(e: MouseEvent): any {
    //e.stopPropagation()
  }
  onMouseDown(e: MouseEvent & { target: HTMLDivElement }): any {
    e.stopPropagation()
    e.preventDefault()

    this.curCol = e.target.parentElement
    this.nxtCol = this.curCol.nextElementSibling
    this.pageX = e.pageX

    const padding = this.paddingDiff(this.curCol)

    this.offsetWidth = this.curCol.offsetWidth
    this.curColWidth = this.offsetWidth! - padding
    if (this.nxtCol) {
      this.nxtColWidth = this.nxtCol.offsetWidth - padding
    }
  }

  paddingDiff(col) {
    const style = window.getComputedStyle(col, null)

    if (style.getPropertyValue('box-sizing') === 'border-box') {
      return 0
    }

    const padLeft = style.getPropertyValue('padding-left')
    const padRight = style.getPropertyValue('padding-right')
    return parseInt(padLeft, 10) + parseInt(padRight, 10)
  }

  createDiv(tableHeight: any) {
    const div = document.createElement('div')
    div.style.top = '0'
    div.style.right = '0'
    div.style.width = '5px'
    div.style.position = 'absolute'
    div.style.cursor = 'col-resize'
    div.style.userSelect = 'none'
    div.style.height = tableHeight + 'px'
    div.style.zIndex = '100'
    return div
  }

  destroy() {
    console.log('destroy')
    this.removeAllDivs()
  }
  removeAllDivs() {
    //throw new Error('Method not implemented.')
  }
}
function handleUpdate(el, binding) {
  const ctx = el.__tableResizable
  const tables = el.getElementsByTagName('table')
  console.log(binding)
  console.log(binding.value?.tablename, binding.oldValue?.tableName)
  if (binding.oldValue !== undefined) {
    console.log(binding.value.tablename, binding.oldValue.tablename)
    if (binding.value.tablename !== binding.oldValue.tablename) {
      if (ctx !== undefined) {
        ctx.destroy()
        delete el.__tableResizable
      }
    }
  }
  if (tables === undefined && ctx !== undefined) {
    // table turned into a grid?
    ctx.destroy()
    delete el.__tableResizable
  } else if (tables !== undefined && ctx === undefined) {
    // new table
    setTimeout(() => {
      el.__tableResizable = new ResizableTable(tables[0])
    }, 250)
  } /*else if (tables !== undefined && ctx !== undefined) {
    // use-case is columns added/removed
    // tear down old one and add new one
    ctx.destroy()
    //delete el.__tableResizable
    setTimeout(() => {
      el.__tableResizable = new ResizableTable(tables[0])
    }, 250)
  }*/
}

const created = (el, binding, vnode, prevVnode) => {
  // see below for details on arguments
  console.log('created', el, binding)
}
// called right before the element is inserted into the DOM.
const beforeMount = (el, binding, vnode, prevVnode) => {
  console.log('beforeMount', el, binding)
  handleUpdate(el, binding)
}
// called when the bound element's parent component
// and all its children are mounted.
const mounted = (el, binding, vnode, prevVnode) => {
  console.log('mounted', el, binding)
}
// called before the parent component is updated
const beforeUpdate = (el, binding, vnode, prevVnode) => {}
// called after the parent component and
// all of its children have updated
const updated = (el, binding, vnode, prevVnode) => {
  console.log('updated', el, binding)
  handleUpdate(el, binding)
}
// called before the parent component is unmounted
const beforeUnmount = (el, binding, vnode, prevVnode) => {
  console.log('beforeUnmount')
  const ctx = el.__tableResizable
  if (ctx) {
    ctx.destroy()
    delete el.__tableResizable
  }
}
// called when the parent component is unmounted
const unmounted = (el, binding, vnode, prevVnode) => {
  console.log('unmounted')
  const ctx = el.__tableResizable
  if (ctx) {
    ctx.destroy()
    delete el.__tableResizable
  }
}

export default {
  created,
  beforeMount,
  mounted,
  beforeUpdate,
  updated,
  beforeUnmount,
  unmounted
}
