# Notes

## Thu 01 Feb 2024 10:30:43 PM EST

- App icon
- Screenshots
- Launch screen
- GoogleService-Info.plist
- Firebase
- iOS Info.plist
- Apple Pay Merchant ID
- Customize Square Android add payment colours

## Tue 26 Dec 2023 04:57:39 PM EST

https://www.reddit.com/r/nestjs/comments/15yb1ek/i_have_seen_so_many_posts_recommending_forwardref/

```TypeScript
        if (squareItemData.imageIds && squareItemData.imageIds.length > 0) {
          for (const squareImageId of squareItemData.imageIds) {
            let catalogImage = await this.catalogImagesService.findOne({
              where: { squareId: squareImageId, catalogId: moaCatalog.id },
            });

            const squareImageForItem = squareImages.find(
              (value) => value.id === squareImageId,
            );

            if (!catalogImage) {
              catalogImage = this.catalogImagesService.create({
                item: moaItem,
                squareId: squareImageId,
                name: squareImageForItem?.imageData?.name,
                url: squareImageForItem?.imageData?.url,
                caption: squareImageForItem?.imageData?.caption,
              });
            } else {
              catalogImage.squareId = squareImageId;
              catalogImage.name = squareImageForItem?.imageData?.name;
              catalogImage.url = squareImageForItem?.imageData?.url;
              catalogImage.caption = squareImageForItem?.imageData?.caption;
              catalogImage.item = moaItem; // Associate the image to the item
            }
            // Save changes to the image
            catalogImage.catalogId = moaCatalog.id;
            await this.catalogImagesService.save(catalogImage);
          }
        } else {
          await this.catalogImagesService.removeAll(
            await this.itemsService.loadManyRelation<CatalogImageEntity>(
              moaItem,
              'images',
            ),
          );
        }

```

## Fri 03 Nov 2023 11:50:42 AM EDT

- Live, functioning preview
- State of the art app powered by Flutter from Google
- Tap location for directions
- Orders only within business hours
- Catalog images
- Full support for single and multiple selection variations and modifiers
- Full support of locations overrides for variations and modifiers
- Configurable pickup lead time
- Web app can be "installed" on Chrome or "added to homescreen" on mobile

## Forward Stripe Webhooks

```bash
stripe listen --forward-to http://localhost:4000/v2/stripe/webhook
https://www.npmjs.com/package/nextjs-google-analytics
```

## Visualize modules

```TypeScript
import { SpelunkerModule } from 'nestjs-spelunker';
const tree = SpelunkerModule.explore(app);
const root = SpelunkerModule.graph(tree);
const edges = SpelunkerModule.findGraphEdges(root);
console.log('graph LR');
const mermaidEdges = edges.map(
({ from, to }) => `  ${from.module.name}-->${to.module.name}`,
);
console.log(mermaidEdges.join('\n'));
```

## Generate secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```

d
