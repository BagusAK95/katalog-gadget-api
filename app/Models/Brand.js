'use strict'

const Model = use('Model')

class Brand extends Model {
    static get createdAtColumn () {
        return ''
    }

    static get updatedAtColumn () {
        return ''
    }
}

module.exports = Brand
