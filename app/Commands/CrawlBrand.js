'use strict'

const { Command } = require('@adonisjs/ace')
const Request = require('request')
const Cheerio = require('cheerio')
const Brand = use('App/Models/Brand')

class CrawlBrand extends Command {
  static get signature () {
    return 'crawl-brand'
  }

  static get description () {
    return 'Crawl all Brands of Gadgets'
  }

  async handle (args, options) {
    this.getBrand()
  }

  async getBrand() {
    Request('https://www.gsmarena.com/makers.php3', (err, resp, body) => {
      if (resp.statusCode != 200) {
        console.error(err)
      } else {
        const $ = Cheerio.load(body)

        $('div.st-text > table > tbody > tr > td > a').each(async (i, elm) => {
          const name = $(elm).text().replace(/\d+\s+devices/gi, '') //BenQ-Siemens27 devices -> BenQ-Siemens
          const source = 'https://www.gsmarena.com/' + $(elm).attr('href') //https://www.gsmarena.com/benq_siemens-phones-42.php
          
          await Brand.findOrCreate({ source: source }, 
                                   { name: name, source: source }) //Find a record, if not found a new record will be created.

          console.log('- ' + name)
        })
      }
    })
  }
}

module.exports = CrawlBrand
