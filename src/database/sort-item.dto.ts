import { SortOrderEnum } from './sort-order.enum.js';

export interface SortItem<FieldEnum> {
  field: FieldEnum;
  sort: SortOrderEnum;
}
