import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { parse as parseSync } from 'csv-parse/sync'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { promises } from 'original-fs'
import utils from '../service/utils'
/**
 * csv 파일로 개별 DB 테이블 생성
 */
export class createKapeDB {
  protected csvroot: string = ''
  protected DBPath: string = ''
  protected kapedb: any = null
  protected cancel: boolean = false
  protected rootpath = ''
  protected tableSetting: any
  protected re: any
  protected redate: any
  protected tableNameInfos: { csvpath: string; tableinfo: any }[] | undefined
  protected convertcount = 0
  onState: ((cmd: string, state?: string, index?: number) => void) | undefined
  strDBname: any
  protected _csvRootPath = ''
  set csvRootPath(value: string) {
    this._csvRootPath = value
  }
  get csvRootPath() {
    return this._csvRootPath
  }

  public constructor() {
    this.rootpath = app.getAppPath()
    const tableSetting = fs.readFileSync(path.join(this.rootpath, 'resources', 'TableSetting.json'), 'utf8')
    this.tableSetting = JSON.parse(tableSetting)
    this.re =
      /^[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-4]):(0[0-9]|[1-5][0-9]):(0[0-9]|[1-5][0-9])/
    this.redate =
      /^([0-9]{4})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]) (오전|오후|AM|PM) ([0-9]|1[0-2]):(0[0-9]|[1-5][0-9]):(0[0-9]|[1-5][0-9])/
  }
  /**
   * csv 파일먕을 테이블 명으로 변환
   * @param tableName :csv 파일명
   * @returns table 명
   */
  protected getTableName(tableName: string) {
    let csTable = null
    const fileTableName = tableName.replace(/^[0-9]+/, '')
    const tableSetInfos = this.tableSetting[this.strDBname]
    for (const tableInfo of tableSetInfos) {
      if (tableInfo['match'].toString() === 'string') {
        if (tableInfo['filename'].toString() === fileTableName.toLowerCase()) {
          csTable = tableInfo
          break
        }
      } else if (tableInfo['match'].toString() === 'regex') {
        const matches = fileTableName.toLowerCase().match(tableInfo['filename'])
        if (matches !== null) {
          csTable = tableInfo
          break
        }
      }
    }
    return csTable
  }
  /**
   * csv 파일 인지 확인
   * @param e : 파일 정보
   * @returns csv:ture, Not csv:false
   */
  protected isCsvFile(e: fs.Dirent) {
    if (e.isFile()) {
      return path.extname(e.name).toLowerCase() === '.csv'
    } else if (e.isDirectory()) {
      const files = fs.readdirSync(path.join(this.csvroot, e.name), { withFileTypes: true })
      const filesList = files.filter((e: fs.Dirent) => this.isCsvFile(e))
    } else return false
  }

  /**
   * table 생성
   * @param tableName  table  명
   * @param columns 컬럼 정보
   * @returns
   */
  protected async createTable(tableName: string, columns: []) {
    const Columns: any = null
    // coulmn number check.
    if (columns === null || columns.length == 0) return false

    let query = `Create Table IF NOT EXISTS ${tableName} (a_id INTEGER PRIMARY KEY AUTOINCREMENT,`
    columns.map((name: string, index: number) => {
      let columnName = name
      if (columnName === '') {
        columnName = `Column_${index}`
      } else {
        if (columnName in columns) {
          columnName = `${columnName}_${index}`
        }
      }
      query += `'${columnName}' text,`
    })
    //query = query.slice(0, -1)

    query += 'a_old_id integer, category_1 text, category_2 text, category_3 text)'
    try {
      await this.kapedb.exec(query)
    } catch (err: any) {
      this.onState!('error', err.toString())
      return false
    }
    return true
  }
  /**
   * table 에 데이터 입력
   * @param tableName table 명
   * @param item 일벽할 테이터
   */
  protected insertDB(newExpense: any, table: any, items: any[]) {
    items.unshift(null) //_id
    items.push(null) //_old_id
    items.push(table._category_1) //_category_1
    items.push(table._category_2) //_category_2
    items.push(table._category_3) //_category_3
    const result = newExpense.run(items)
  }

  /**
   * csv 파일의 db table 생성 및 insert 한다.
   * @param filename csv 파일 걍로
   * @param tableName table 명
   */
  /*protected async csvtodbSync(filename: string, table: any) {
    try {
      const kapeCsv = fs.readFileSync(path.join(this.csvroot, filename), 'utf-8')
      table.csvfilename = filename
      const kapeCsvList = parseSync(kapeCsv)
      for (let i = 0; i < kapeCsvList.length; i++) {
        if (this.cancel) return
        if (i === 0) {
          if (await this.createTable(table.tablename, kapeCsvList[i])) {
            this.onState!('create', table.tablename, kapeCsvList.length - 1)
          } else return false
        } else {
          try {
            await this.insertDB(table, kapeCsvList[i])
            this.onState!('insert', table.tablename, i)
          } catch (err: any) {
            console.log(table, err)
            this.onState!('error', err.toString())
            return false
          }
        }
      }
      this.onState!('insert end', table.tablename)
    } catch (err: any) {
      console.log(filename)
    }
    return true
  }*/

  /**
   * csv 파일의 db table 생성 및 insert 한다.
   * @param filename csv 파일 걍로
   * @param tableName table 명
   */
  protected async csvtodb(filename: string, table: any) {
    const stream = fs.createReadStream(filename)
    table.csvfilename =
      filename.length > this._csvRootPath.length ? filename.substring(this._csvRootPath.length) : filename
    const parser = stream.pipe(
      parse({
        delimiter: ',',
        trim: true,
        bom: true,
        skip_empty_lines: true
      })
    )
    let count = 0
    let isCreateTable = false
    var begin = this.kapedb.prepare('BEGIN')
    var commit = this.kapedb.prepare('COMMIT')
    var rollback = this.kapedb.prepare('ROLLBACK')
    try {
      let insertPrepare: any = null
      for await (const records of parser) {
        if (this.cancel) {
          await rollback.run()
          return
        }
        if (count == 0) {
          table.tablename = table.tablename.trim()
          isCreateTable = await this.createTable(table.tablename, records)
          //this.onState!('create table', table.tablename)
          let values = '?,'.repeat(records.length)

          //category 컬럼, filename 컬럼 추가
          values += '?,?,?,?,?'
          insertPrepare = this.kapedb.prepare(`INSERT INTO ${table.tablename} VALUES (${values})`)
          await begin.run()
        } else {
          //if (count == 1) {
          //this.onState!('inset start', table.tablename)
          //}
          let index = 0
          for (const record of records) {
            if (table.tablename === 'BrowsingHistory') {
              const datetime = this.redate.exec(record)
              if (datetime) {
                records[index] = utils.webDateToDate(datetime)
              }
            } else {
              const datetime = this.re.exec(record)
              if (datetime) {
                records[index] = datetime[0]
              }
            }
            index++
          }
          this.insertDB(insertPrepare, table, records)
        }
        count++
        if (isCreateTable === false) break
      }
      await commit.run()
      //this.onState!('insert end', table.tablename)
    } catch (err: any) {
      await rollback.run()
      this.onState!('error', table.tablename, -1)
      console.log(err)
    }
    return true
  }
  /**
   * csv 파일명을 기반으로 테이블명 생성
   * @param csvpath csv 파일 root 경로
   * @returns 생성된 테이블 명
   */
  public getTables(csvpath: string) {
    this.csvroot = csvpath
    this.strDBname = path.basename(this.csvroot)
    this.convertcount = 0
    const files = fs.readdirSync(this.csvroot, { withFileTypes: true })
    for (const dirent of files) {
      if (dirent.isFile()) {
        if (path.extname(dirent.name).toLowerCase() === '.csv') {
          const table = this.getTableName(dirent.name)
          if (table) {
            this.convertcount++
            this.tableNameInfos?.push({ tableinfo: table, csvpath: path.join(csvpath, dirent.name) })
          }
        }
      } else if (dirent.isDirectory()) {
        const dirfiles = fs.readdirSync(path.join(this.csvroot, dirent.name), { withFileTypes: true })
        for (const dirent1 of dirfiles) {
          if (this.cancel) return
          if (dirent1.isFile()) {
            if (path.extname(dirent1.name).toLowerCase() === '.csv') {
              const table = this.getTableName(dirent1.name)
              if (table) {
                this.convertcount++
                this.tableNameInfos?.push({ tableinfo: table, csvpath: path.join(csvpath, dirent.name, dirent1.name) })
              }
            }
          }
        }
      }
    }
    fs
    return this.convertcount
  }

  /**
   * csv 파일 변환 db 변환 작업
   */
  protected async convert() {
    this.convertcount = 0
    if (this.tableNameInfos) {
      for (const tableInfo of this.tableNameInfos) {
        if (this.cancel) return
        this.convertcount++
        //console.log(this.convertcount, tableInfo.tableinfo.tablename)
        await this.csvtodb(tableInfo.csvpath, tableInfo.tableinfo)
        this.onState!(
          'create',
          tableInfo.tableinfo.tablename,
          Math.floor((this.convertcount / this.tableNameInfos.length) * 100)
        )
      }
    }
  }
  /*files.map( ( e:fs.Dirent)=>{
      if(e.isFile())
      {
        path.extname(e.name).toLowerCase() === '.csv'
        let tableName= path.basename(e.name, ".csv")
        tableName = this.getTableName(tableName)
        if(tableName)
           await this.csvtodb(e.path + "/" + e.name, tableName)
      }else if(e.isDirectory())
      {
        const dirfiles = fs.readdirSync(path.join( this.csvroot, e.name) , {withFileTypes:true})
        dirfiles.map(async ( e:fs.Dirent)=>{
          if(e.isFile())
          {
            path.extname(e.name).toLowerCase() === '.csv'
            let tableName= path.basename(e.name, ".csv")
            tableName = this.getTableName(tableName)
            if(tableName)
              await this.csvtodb(e.path + "/" + e.name, tableName)
          }
        })
      }
    })*/

  async convertCSV(csvroot: string) {
    const csvdirs = fs.readdirSync(csvroot, { withFileTypes: true }).filter(function (file) {
      return file.isDirectory()
    })
  }
  /**
   * kape 변환한 각 파트별 root 경로
   * @param csvpath csv 파일이 있는 root 경로
   * @param onState 처리 상태 콜백
   * @returns
   */
  async convertDB() {
    this.cancel = false
    this.onState!('start', '', 0)

    await this.convert()
    this.onState!('end', '', 100)
  }
  /**
   * DB 닫고 작업 취소
   */
  close() {
    this.cancel = true
    this.kapedb.close()
  }
  async CreateDB(dbPath: string, onState?: (cmd: string, state?: string, index?: number) => void) {
    this.DBPath = dbPath
    this.onState = onState
    try {
      const dbDir = path.dirname(this.DBPath)
      if (!utils.isDirectory(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }
      this.kapedb = new Database(this.DBPath)
      //this.kapedb =  new sqlite3.Database(this.DBPath);
      /*this.kapedb = await open({
        filename:  this.DBPath,
        mode: sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
        driver: sqlite3.Database
      })*/
      this.tableNameInfos = []
    } catch (err: any) {
      console.log(err)
      this.DBPath = ''
      onState!('error', err.toString())
      this.onState = undefined
      return
    }
    this.onState!('open', '')
  }
}
