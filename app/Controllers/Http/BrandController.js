'use strict'

const Brand = use('App/Models/Brand')

class BrandController {
    async index () {
        return await Brand.all()
    }
    
    async store ({request}) {
        return await Brand.create(request.all())
    }
    
    async show({params}){
        return await Brand.query()
                          .where({'id' : params.id})
                          .fetch()
    }
    
    async update({params, request}){
        return await Brand.query()
                          .where({'id' : params.id})
                          .update(request.all())
    }
    
    async destroy({params}){
        return await Brand.query()
                          .where({'id' : params.id})
                          .delete()
    }
    
    async paginate({params}){
        return await Brand.query()
                          .paginate(Number(params.page), Number(params.limit)) //Doc: https://www.npmjs.com/package/lucid-mongo
    }
}

module.exports = BrandController
