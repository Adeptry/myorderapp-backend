# Forward Stripe Webhooks

```
stripe listen --forward-to http://localhost:4000/v2/stripe/webhook
https://www.npmjs.com/package/nextjs-google-analytics
```

# Visualize modules

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

# Generate secrets

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```
