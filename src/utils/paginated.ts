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

export const paginatedResults = <T>(params: {
  results: [T[], number];
  pagination: PaginationOptions;
}): InfinityPaginationResultType<T> => {
  return {
    data: params.results[0],
    count: params.results[1],
    pages: Math.floor(params.results[1] / (params.pagination.limit ?? 1)),
  };
};
