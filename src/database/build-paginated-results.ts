import { PaginationOptionsInput } from './pagination-options-input.dto.js';
import { PaginationResultType } from './pagination-result.type.js';

export const buildPaginatedResults = <T>(params: {
  results: [T[], number];
  pagination: PaginationOptionsInput;
}): PaginationResultType<T> => {
  return {
    data: params.results[0],
    count: params.results[1],
    pages: Math.ceil(
      params.results[1] /
        (params.pagination.limit == 0
          ? params.results[1]
          : params.pagination.limit),
    ),
  };
};
