import { SortItem } from './sort-item.dto.js';

export interface SortItemsInput<FieldEnum> {
  items: SortItem<FieldEnum>[];
}
