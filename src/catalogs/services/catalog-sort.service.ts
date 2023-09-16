import { Injectable } from '@nestjs/common';
import { Item } from '../../catalogs/entities/item.entity.js';

@Injectable()
export class CatalogSortService {
  sortItems(items: Item[]): Item[] {
    return items.map((item) => {
      item.variations?.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
      item.itemModifierLists?.forEach((itemModifierList) => {
        itemModifierList.modifierList?.modifiers?.sort(
          (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0),
        );
      });
      return item;
    });
  }
}
