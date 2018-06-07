'use strict'

const { Command } = require('@adonisjs/ace')
const Request = require('request')
const Cheerio = require('cheerio')
const AsyncLoop = require('node-async-loop')
const TableToJSON = require('tabletojson')
const Brand = use('App/Models/Brand')
const Katalog = use('App/Models/Katalog')

class CrawlKatalog extends Command {
  static get signature () {
    return 'crawl-katalog'
  }

  static get description () {
    return 'Crawl all Products from the Brands list'
  }

  async handle (args, options) {
    console.log('Crawl Source Started! -->')
    const queue = await this.getQueueBrand()
    if (queue) {
      console.log('Brand: ' + queue.name)
      await Brand.query().where({id: queue.id}).update({crawl_status: 1})
      this.getSource(queue.id, queue.source)      
    } else {
      this.getSource(null, null)      
    }
  }

  async getQueueBrand() {
    const queue = await Brand.query().where({crawl_status:0}).first()
    return queue
  }

  async getSource(brand_id, url) {
    if (brand_id && url) {
      Request(url, (err, resp, body) => {
        if (resp.statusCode != 200) {
          console.error(url + ': ' + err)
        } else {
          const $ = Cheerio.load(body)

          const element = $('div.makers > ul > li > a').map((i, elm) => {
            return elm
          }).get()

          AsyncLoop(element, async (elm, next) => {
            const name = $(elm).text()
            const source = 'https://www.gsmarena.com/' + $(elm).attr('href')
            const image = $(elm).children('img')

            await Katalog.findOrCreate({ source: source }, 
                                       { brand_id: brand_id,
                                         name: name, 
                                         source: source,
                                         image: image.attr('src')}) //Find a record, if not found a new record will be created.

            console.log('- ' + name)

            next()
          }, async () => {
            const nextPage = $('a.pages-next').attr('href')
            if (nextPage != null && nextPage != '#1') {
              console.log('---> Next Page <---')
              this.getSource(brand_id, 'https://www.gsmarena.com/' + nextPage)                    
            } else {
              await Brand.query().where({id: brand_id}).update({crawl_status: 2})

              const queue = await this.getQueueBrand()
              if (queue) {
                console.log('Brand: ' + queue.name)
                await Brand.query().where({id: queue.id}).update({crawl_status: 1})                
                this.getSource(queue.id, queue.source)      
              } else {
                this.getSource(null, null)      
              }
            }
          })
        }
      })
    } else {
      console.log('<-- Crawl Source Finished!')
      
      console.log('Crawl Detail Started! -->')           
      this.getDetail(await this.getQueueKatalog()) //Crawl detail
    }
  }

  async getQueueKatalog() {
    const queue = await Katalog.query().where({crawl_status:0}).first()
    if (queue) {
      await Katalog.query().where({id: queue.id}).update({crawl_status: 1})                      
      return queue.source      
    } else {
      return null
    }
  }

  async getDetail(url) {
    if (url) {
      Request(url, (err, resp, body) => {
        const $ = Cheerio.load(body)
 
        const element = $('div#specs-list > table > tbody').map((i, elm) => {
          return elm
        }).get()

        let detail = {}        
        AsyncLoop(element, async (elm, next) => {
          let cat = $(elm).children('tr').children('th').text()
          
          let subcat = {}
          $(elm).children('tr').each((i, elm) => {
            let td = $(elm).children('td').map((i, elm) => {
              return $(elm).text()
            }).get()

            if (td[0]) {
              if (td[0].trim().length == 0) {
                subcat['Other'] = td[1]              
              } else {
                subcat[td[0]] = td[1]
              }
            }
          })

          detail[cat] = subcat

          next()
        }, () => {
          //console.log(detail)

          let name = $('h1.specs-phone-name-title').text().trim()
          let announced = detail['Launch']['Announced'].match(/\d{4}\,\s(January|February|March|April|May|June|July|August|September|October|November|December)/g)
          if (announced) {
            announced = announced[0].replace(' January','00').replace(' February','01').replace(' March','02').replace(' April','03').replace(' May','04').replace(' June' ,'05').replace(' July','06').replace(' August','07').replace(' September','08').replace(' October','09').replace(' November','10').replace(' December','11').split(',') // 2018, March => 2018,02            
            announced = new Date(announced[0], announced[1], 1)
          } else {
            let year = detail['Launch']['Announced'].match(/\d{4}/g)
            if (year) {
              announced = new Date(year[0], 0, 1)
            } else {
              announced = null
            }
          }
          let os = detail['Platform']
          if (os) os = os['OS']
          if (os) os = os.split(',')[0].split('-')[0].split('/')[0].trim()
          let storage = detail['Memory']
          if (storage) storage = storage['Internal']
          if (storage) storage = storage.match(/(\d{1,3}(\s|)(GB|MB)(,|$)|\d{1,3}(\s|)(GB|MB)\sROM)/g)
          if (storage) storage = storage.join('/').replace(/(\,|\s|(\s|)ROM)/g, '').trim()
          let card_slot = detail['Memory']
          if (card_slot) card_slot = card_slot['Card slot']
          if (card_slot) card_slot = card_slot.match(/\(.*\)/g)
          if (card_slot) card_slot = card_slot[0].replace(/(\(|\))/g, '').trim()
          let ram = detail['Memory']
          if (ram) ram = ram['Internal']
          if (ram) ram = ram.match(/\d{1,3}(\s|)(GB|MB)\sRAM/g)
          if (ram) ram = ram.join('/').replace(/(\sRAM|\s)/g, '').trim()
          let size = detail['Display']
          if (size) size = size['Size']
          if (size) size = size.match(/\d{1,2}\.\d{1,2}\sinches/g)
          if (size) size = size[0].replace(/\sinches/g, '').trim()
          let ratio = detail['Display']
          if (ratio) ratio = ratio['Resolution']
          if (ratio) ratio = ratio.match(/\d{1,2}\:\d{1,2}\sratio/g)
          if (ratio) ratio = ratio[0].replace(/\sratio/g, '').trim()
          let display_type = detail['Display']
          if (display_type) display_type = display_type['Type']
          if (display_type) display_type = display_type.match(/(IPS|OLED|TFT)/g)
          if (display_type) display_type = display_type[0].trim()
          let camera_primary = detail['Camera']
          if (camera_primary) camera_primary = camera_primary['Primary']
          if (camera_primary) {
            if (camera_primary.match(/^(Dual:|Tripple:)/g)) {
              if (camera_primary) camera_primary = camera_primary.match(/(\d{1,2}(\s|)MP|VGA)/g)
              if (camera_primary) camera_primary = camera_primary.join('+').replace(/\s/g, '').trim()
            } else {
              if (camera_primary) camera_primary = camera_primary.match(/(\d{1,2}(\s|)MP|VGA)/g)
              if (camera_primary) camera_primary = camera_primary.join('/').replace(/\s/g, '').trim() 
            }
          }
          let camera_secondry = detail['Camera']
          if (camera_secondry) camera_secondry = camera_secondry['Secondary']
          if (camera_secondry) {
            if (camera_secondry.match(/^(Dual:|Tripple:)/g)) {
              if (camera_secondry) camera_secondry = camera_secondry.match(/(\d{1,2}(\s|)MP|VGA)/g)
              if (camera_secondry) camera_secondry = camera_secondry.join('+').replace(/\s/g, '').trim()            
            } else {
              if (camera_secondry) camera_secondry = camera_secondry.match(/(\d{1,2}(\s|)MP|VGA)/g)
              if (camera_secondry) camera_secondry = camera_secondry.join('/').replace(/\s/g, '').trim()
            }
          }
          let chipset = detail['Platform']
          if (chipset) chipset = chipset['Chipset']
          if (chipset) chipset = chipset.match(new RegExp('(.*)' + $('li.help-expansion > div').text(), 'gi'))
          if (chipset) chipset = chipset[0].trim()          
          let battery = detail['Battery']
          if (battery) battery = battery['Other']
          if (battery) battery = battery.match(/\d{2,4}\s(mAh|Wh)/g)
          if (battery) battery = battery[0].replace(/\s(mAh|Wh)/g, '').trim()
          let hits = $('li.help-popularity > span').text().match(/\d/g)
          if (hits) hits = hits.join('').trim()
          
          Request('https://www.gsmarena.com/' + $('div.specs-photo-main > a').attr('href'), async (err, resp, body) => {
            const $ = Cheerio.load(body)

            let galery = $('div#pictures-list > img').map((i, elm) => {
              return $(elm).attr('src')
            }).get().join(',')

            const katalog = { 
              name: name,
              announced: announced,
              os: os,
              storage: storage,
              card_slot: card_slot,
              ram: ram,
              size: size,
              ratio: ratio,
              display_type: display_type,
              camera_primary: camera_primary,
              camera_secondry: camera_secondry,
              chipset: chipset,
              battery: battery,
              hits: hits,
              galery: galery,
              detail: JSON.stringify(detail),
              crawl_status: 2
            }
  
            console.log('- ' + name + ': Success')
            
            await Katalog.query().where({source: url}).update(katalog)                      
            this.getDetail(await this.getQueueKatalog())
          })          
        })
      })
    } else {
      console.log('<-- Crawl Detail Finished!')
    }
  }
}

module.exports = CrawlKatalog
