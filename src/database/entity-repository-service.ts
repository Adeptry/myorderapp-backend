/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  ObjectId,
  ObjectLiteral,
  QueryRunner,
  RemoveOptions,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { PickKeysByType } from 'typeorm/common/PickKeysByType.js';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions.js';
import { RepositoryServiceLogger } from './reposistory-service-logger';

// Be sure to mark your service as injectable
export abstract class EntityRepositoryService<Entity extends ObjectLiteral> {
  constructor(
    // And be sure to inject your repository
    protected readonly repository: Repository<Entity>,
    protected readonly logger: RepositoryServiceLogger,
  ) {}

  createQueryBuilder(
    alias?: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<Entity> {
    this.logger.verbose(this.createQueryBuilder.name);
    return this.repository.createQueryBuilder(alias, queryRunner);
  }
  hasId(entity: Entity): boolean {
    this.logger.verbose(this.hasId.name);
    return this.repository.hasId(entity);
  }
  getId(entity: Entity): any {
    this.logger.verbose(this.getId.name);
    return this.repository.getId(entity);
  }
  createEmpty(): Entity {
    this.logger.verbose(this.createEmpty.name);
    return this.repository.create();
  }
  createAll(entityLikeArray: DeepPartial<Entity>[]): Entity[] {
    this.logger.verbose(this.createAll.name);
    return this.repository.create(entityLikeArray);
  }
  create(entityLike: DeepPartial<Entity>): Entity {
    this.logger.verbose(this.create.name);
    return this.repository.create(entityLike);
  }
  merge(
    mergeIntoEntity: Entity,
    ...entityLikes: DeepPartial<Entity>[]
  ): Entity {
    this.logger.verbose(this.merge.name);
    return this.repository.merge(mergeIntoEntity, ...entityLikes);
  }
  preload(entityLike: DeepPartial<Entity>): Promise<Entity | undefined> {
    this.logger.verbose(this.preload.name);
    return this.repository.preload(entityLike);
  }
  saveAll<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<(T & Entity)[]> {
    this.logger.verbose(this.saveAll.name);
    return this.repository.save(entities, options);
  }
  save<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T> {
    this.logger.verbose(this.save.name);
    return this.repository.save(entity, options);
  }
  removeAll(entities: Entity[], options?: RemoveOptions): Promise<Entity[]> {
    this.logger.verbose(this.removeAll.name);
    return this.repository.remove(entities, options);
  }
  remove(entity: Entity, options?: RemoveOptions): Promise<Entity> {
    this.logger.verbose(this.remove.name);
    return this.repository.remove(entity, options);
  }
  softRemoveAll<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<(T & Entity)[]> {
    this.logger.verbose(this.softRemoveAll.name);
    return this.repository.softRemove(entities, options);
  }
  softRemove<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Entity> {
    this.logger.verbose(this.softRemove.name);
    return this.repository.softRemove(entity, options);
  }
  recoverAll<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<(T & Entity)[]> {
    this.logger.verbose(this.recoverAll.name);
    return this.repository.recover(entities, options);
  }
  recover<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Entity> {
    this.logger.verbose(this.recover.name);
    return this.repository.recover(entity, options);
  }
  insert(
    entity: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[],
  ): Promise<InsertResult> {
    this.logger.verbose(this.insert.name);
    return this.repository.insert(entity);
  }
  update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
    partialEntity: QueryDeepPartialEntity<Entity>,
  ): Promise<UpdateResult> {
    this.logger.verbose(this.update.name);
    return this.repository.update(criteria, partialEntity);
  }
  upsert(
    entityOrEntities:
      | QueryDeepPartialEntity<Entity>
      | QueryDeepPartialEntity<Entity>[],
    conflictPathsOrOptions: string[] | UpsertOptions<Entity>,
  ): Promise<InsertResult> {
    this.logger.verbose(this.upsert.name);
    return this.repository.upsert(entityOrEntities, conflictPathsOrOptions);
  }
  delete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
  ): Promise<DeleteResult> {
    this.logger.verbose(this.delete.name);
    return this.repository.delete(criteria);
  }
  softDelete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
  ): Promise<UpdateResult> {
    this.logger.verbose(this.softDelete.name);
    return this.repository.softDelete(criteria);
  }
  restore(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
  ): Promise<UpdateResult> {
    this.logger.verbose(this.restore.name);
    return this.repository.restore(criteria);
  }
  exist(options?: FindManyOptions<Entity>): Promise<boolean> {
    this.logger.verbose(this.exist.name);
    return this.repository.exist(options);
  }
  count(options?: FindManyOptions<Entity>): Promise<number> {
    this.logger.verbose(this.count.name);
    return this.repository.count(options);
  }
  countBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number> {
    this.logger.verbose(this.countBy.name);
    return this.repository.countBy(where);
  }
  sum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    this.logger.verbose(this.sum.name);
    return this.repository.sum(columnName, where);
  }
  average(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    this.logger.verbose(this.average.name);
    return this.repository.average(columnName, where);
  }
  minimum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    this.logger.verbose(this.minimum.name);
    return this.repository.minimum(columnName, where);
  }
  maximum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    return this.repository.maximum(columnName, where);
  }
  find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    this.logger.verbose(this.find.name);
    return this.repository.find(options);
  }
  findBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity[]> {
    this.logger.verbose(this.findBy.name);
    return this.repository.findBy(where);
  }
  findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    this.logger.verbose(this.findAndCount.name);
    return this.repository.findAndCount(options);
  }
  findAndCountBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<[Entity[], number]> {
    this.logger.verbose(this.findAndCountBy.name);
    return this.repository.findAndCountBy(where);
  }
  findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    this.logger.verbose(this.findOne.name);
    return this.repository.findOne(options);
  }
  findOneBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity | null> {
    this.logger.verbose(this.findOneBy.name);
    return this.repository.findOneBy(where);
  }
  findOneOrFail(options: FindOneOptions<Entity>): Promise<Entity> {
    this.logger.verbose(this.findOneOrFail.name);
    return this.repository.findOneOrFail(options);
  }
  findOneByOrFail(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity> {
    this.logger.verbose(this.findOneByOrFail.name);
    return this.repository.findOneByOrFail(where);
  }
  query(query: string, parameters?: any[]): Promise<any> {
    this.logger.verbose(this.query.name);
    return this.repository.query(query, parameters);
  }
  clear(): Promise<void> {
    this.logger.verbose(this.clear.name);
    return this.repository.clear();
  }
  increment(
    conditions: FindOptionsWhere<Entity>,
    propertyPath: string,
    value: number | string,
  ): Promise<UpdateResult> {
    this.logger.verbose(this.increment.name);
    return this.repository.increment(conditions, propertyPath, value);
  }
  decrement(
    conditions: FindOptionsWhere<Entity>,
    propertyPath: string,
    value: number | string,
  ): Promise<UpdateResult> {
    this.logger.verbose(this.decrement.name);
    return this.repository.decrement(conditions, propertyPath, value);
  }
  extend<CustomRepository>(
    custom: CustomRepository & ThisType<CustomRepository>,
  ): CustomRepository {
    this.logger.verbose(this.extend.name);
    return this.repository.extend(custom);
  }
  async loadOneRelation<Relation>(
    entity: Entity,
    relation: string,
  ): Promise<Relation | undefined> {
    this.logger.verbose(this.loadOneRelation.name);
    return this.repository
      .createQueryBuilder()
      .relation(relation)
      .of(entity)
      .loadOne();
  }
  async loadManyRelation<Relation>(
    entity: Entity,
    relation: string,
  ): Promise<Relation[]> {
    this.logger.verbose(this.loadManyRelation.name);
    return this.repository
      .createQueryBuilder()
      .relation(relation)
      .of(entity)
      .loadMany();
  }
}
