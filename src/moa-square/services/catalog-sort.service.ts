import { Injectable } from '@nestjs/common';
import { ItemEntity } from '../entities/item.entity';

@Injectable()
export class CatalogSortService {
  sortItems(items: ItemEntity[]): ItemEntity[] {
    return items.map((item) => {
      return this.sortItem(item);
    });
  }

  sortItem(item: ItemEntity): ItemEntity {
    item.variations?.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
    item.itemModifierLists?.forEach((itemModifierList) => {
      itemModifierList.modifierList?.modifiers?.sort(
        (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0),
      );
    });
    return item;
  }
}
