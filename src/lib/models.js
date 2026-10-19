// Maps product names to their model (the folder names in src/data/image-groups.json).
// Units of the same model share photos and are compared with each other in the suggestions.
import groups from '../data/image-groups.json';

const modelOfName = new Map();
for (const [model, names] of Object.entries(groups)) {
  for (const name of names) modelOfName.set(name.trim(), model);
}

export function modelOf(productName) {
  const name = productName.trim();
  return modelOfName.get(name) ?? name;
}
