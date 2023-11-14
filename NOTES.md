# Notes

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

```
stripe listen --forward-to http://localhost:4000/v2/stripe/webhook
https://www.npmjs.com/package/nextjs-google-analytics
```

## Visualize modules

```
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

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```
d