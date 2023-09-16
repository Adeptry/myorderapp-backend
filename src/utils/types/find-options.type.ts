import { EntityCondition } from './entity-condition.type.js';

export type FindOptions<T> = {
  where: EntityCondition<T>[] | EntityCondition<T>;
};
