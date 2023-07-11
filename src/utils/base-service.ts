import { Injectable } from '@nestjs/common';
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
import { PickKeysByType } from 'typeorm/common/PickKeysByType';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';

@Injectable()
export abstract class BaseService<Entity extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<Entity>) {}

  createQueryBuilder(
    alias?: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<Entity> {
    return this.repository.createQueryBuilder(alias, queryRunner);
  }
  hasId(entity: Entity): boolean {
    return this.repository.hasId(entity);
  }
  getId(entity: Entity): any {
    return this.repository.getId(entity);
  }
  createEmpty(): Entity {
    return this.repository.create();
  }
  createAll(entityLikeArray: DeepPartial<Entity>[]): Entity[] {
    return this.repository.create(entityLikeArray);
  }
  create(entityLike: DeepPartial<Entity>): Entity {
    return this.repository.create(entityLike);
  }
  merge(
    mergeIntoEntity: Entity,
    ...entityLikes: DeepPartial<Entity>[]
  ): Entity {
    return this.repository.merge(mergeIntoEntity, ...entityLikes);
  }
  preload(entityLike: DeepPartial<Entity>): Promise<Entity | undefined> {
    return this.repository.preload(entityLike);
  }
  saveAll<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<(T & Entity)[]> {
    return this.repository.save(entities, options);
  }
  save<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T> {
    return this.repository.save(entity, options);
  }
  removeAll(entities: Entity[], options?: RemoveOptions): Promise<Entity[]> {
    return this.repository.remove(entities, options);
  }
  remove(entity: Entity, options?: RemoveOptions): Promise<Entity> {
    return this.repository.remove(entity, options);
  }
  softRemoveAll<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<(T & Entity)[]> {
    return this.repository.softRemove(entities, options);
  }
  softRemove<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Entity> {
    return this.repository.softRemove(entity, options);
  }
  recoverAll<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<(T & Entity)[]> {
    return this.repository.recover(entities, options);
  }
  recover<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Entity> {
    return this.repository.recover(entity, options);
  }
  insert(
    entity: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[],
  ): Promise<InsertResult> {
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
    return this.repository.update(criteria, partialEntity);
  }
  upsert(
    entityOrEntities:
      | QueryDeepPartialEntity<Entity>
      | QueryDeepPartialEntity<Entity>[],
    conflictPathsOrOptions: string[] | UpsertOptions<Entity>,
  ): Promise<InsertResult> {
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
    return this.repository.restore(criteria);
  }
  exist(options?: FindManyOptions<Entity>): Promise<boolean> {
    return this.repository.exist(options);
  }
  count(options?: FindManyOptions<Entity>): Promise<number> {
    return this.repository.count(options);
  }
  countBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number> {
    return this.repository.countBy(where);
  }
  sum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    return this.repository.sum(columnName, where);
  }
  average(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    return this.repository.average(columnName, where);
  }
  minimum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    return this.repository.minimum(columnName, where);
  }
  maximum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number | null> {
    return this.repository.maximum(columnName, where);
  }
  find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.repository.find(options);
  }
  findBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity[]> {
    return this.repository.findBy(where);
  }
  findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    return this.repository.findAndCount(options);
  }
  findAndCountBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<[Entity[], number]> {
    return this.repository.findAndCountBy(where);
  }
  findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.repository.findOne(options);
  }
  findOneBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity | null> {
    return this.repository.findOneBy(where);
  }
  findOneOrFail(options: FindOneOptions<Entity>): Promise<Entity> {
    return this.repository.findOneOrFail(options);
  }
  findOneByOrFail(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity> {
    return this.repository.findOneByOrFail(where);
  }
  query(query: string, parameters?: any[]): Promise<any> {
    return this.repository.query(query, parameters);
  }
  clear(): Promise<void> {
    return this.repository.clear();
  }
  increment(
    conditions: FindOptionsWhere<Entity>,
    propertyPath: string,
    value: number | string,
  ): Promise<UpdateResult> {
    return this.repository.increment(conditions, propertyPath, value);
  }
  decrement(
    conditions: FindOptionsWhere<Entity>,
    propertyPath: string,
    value: number | string,
  ): Promise<UpdateResult> {
    return this.repository.decrement(conditions, propertyPath, value);
  }
  extend<CustomRepository>(
    custom: CustomRepository & ThisType<CustomRepository>,
  ): CustomRepository {
    return this.repository.extend(custom);
  }
}
