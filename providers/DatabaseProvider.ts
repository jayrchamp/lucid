/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IocContract } from '@adonisjs/fold'

import { Schema } from '../src/Schema'
import { Database } from '../src/Database'
import { Adapter } from '../src/Orm/Adapter'
import { Config } from '../src/Orm/Config'
import { BaseModel } from '../src/Orm/BaseModel'
import { extendValidator } from '../src/Bindings/Validator'

import {
  column,
  hasOne,
  hasMany,
  computed,
  belongsTo,
  manyToMany,
  hasManyThrough,
} from '../src/Orm/Decorators'

import { scope } from '../src/Helpers/scope'

/**
 * Database service provider
 */
export default class DatabaseServiceProvider {
  constructor (protected $container: IocContract) {
  }

  /**
   * Register the database binding
   */
  private registerDatabase () {
    this.$container.singleton('Adonis/Lucid/Database', () => {
      const config = this.$container.use('Adonis/Core/Config').get('database', {})
      const Logger = this.$container.use('Adonis/Core/Logger')
      const Profiler = this.$container.use('Adonis/Core/Profiler')
      const Emitter = this.$container.use('Adonis/Core/Event')
      return new Database(config, Logger, Profiler, Emitter)
    })
  }

  /**
   * Registers ORM
   */
  private registerOrm () {
    this.$container.singleton('Adonis/Lucid/Orm', () => {
      const config = this.$container.use('Adonis/Core/Config').get('database.orm', {})

      /**
       * Attaching adapter to the base model. Each model is allowed to define
       * a different adapter.
       */
      BaseModel.$adapter = new Adapter(this.$container.use('Adonis/Lucid/Database'))
      BaseModel.$container = this.$container
      BaseModel.$configurator = Object.assign({}, Config, config)

      return {
        BaseModel,
        column,
        computed,
        hasOne,
        hasMany,
        belongsTo,
        manyToMany,
        hasManyThrough,
        scope,
      }
    })
  }

  /**
   * Registers schema class
   */
  private registerSchema () {
    this.$container.singleton('Adonis/Lucid/Schema', () => {
      return Schema
    })
  }

  /**
   * Registers the health checker
   */
  private registerHealthChecker () {
    this.$container.with(
      ['Adonis/Core/HealthCheck', 'Adonis/Lucid/Database'],
      (HealthCheck) => HealthCheck.addChecker('lucid', 'Adonis/Lucid/Database'),
    )
  }

  /**
   * Extends the validator by defining validation rules
   */
  private defineValidationRules () {
    this.$container.with(['Adonis/Core/Validator', 'Adonis/Lucid/Database'], (Validator, Db) => {
      extendValidator(Validator.validator, Db)
    })
  }

  /**
   * Called when registering providers
   */
  public register (): void {
    this.registerDatabase()
    this.registerOrm()
    this.registerSchema()
  }

  /**
   * Called when all bindings are in place
   */
  public boot (): void {
    this.registerHealthChecker()
    this.defineValidationRules()
  }
}
