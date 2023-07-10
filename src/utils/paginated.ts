import { InfinityPaginationResultType } from './types/infinity-pagination-result.type';
import { PaginationOptions } from './types/pagination-options';

export const paginated = <T>(params: {
  data: T[];
  count: number;
  pagination: PaginationOptions;
}): InfinityPaginationResultType<T> => {
  return {
    data: params.data,
    count: params.count,
    pages: Math.floor(params.count / (params.pagination.limit ?? 1)),
  };
};
