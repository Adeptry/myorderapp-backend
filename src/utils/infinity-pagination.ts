import { InfinityPaginationResultType } from './types/infinity-pagination-result.type';
import { PaginationOptions } from './types/pagination-options';

export const infinityPagination = <T>(params: {
  many: T[];
  count: number;
  pagination: PaginationOptions;
}): InfinityPaginationResultType<T> => {
  return {
    data: params.many,
    pages: Math.floor(params.count / (params.pagination.limit ?? 1)),
  };
};
