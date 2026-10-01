import { Apple, Carrot, Citrus, CookingPot, Droplet, Drumstick, Egg, Fish, Leaf, Milk, Nut, Salad, Soup, Sprout, Wheat } from 'lucide-react'
import clsx from 'clsx'
import styles from './Shop.module.css'

/**
 * A drawn tile for each product until real photography is ready.
 * Colour follows the category; the icon follows the product.
 */
const ICONS = {
  ugu: Leaf, spinach: Leaf, waterleaf: Leaf, 'scent-leaves': Leaf, 'garden-eggs': Apple, plantain: Sprout,
  tomatoes: Apple, 'pepper-mix': Sprout, onions: Sprout, carrots: Carrot, okra: Sprout, 'sweet-potato': Carrot, yam: Carrot,
  'lettuce-cucumber': Salad, 'green-beans': Sprout, 'stir-fry-mix': Salad, corn: Wheat, coconut: Nut,
  oranges: Citrus, bananas: Apple, pawpaw: Apple, avocado: Apple, watermelon: Apple,
  'fish-croaker': Fish, prawns: Fish, crayfish: Fish, chicken: Drumstick, beef: Drumstick, pork: Drumstick, eggs: Egg,
  'palm-oil': Droplet, 'veg-oil': Droplet, 'olive-oil': Droplet, 'pepper-soup-spice': Soup, groundnuts: Nut, 'groundnut-paste': Nut,
  cashews: Nut, 'tiger-nuts': Nut, dates: Nut, egusi: Nut, milk: Milk, yoghurt: Milk,
}
const CATEGORY_ICON = { produce: Leaf, grains: Wheat, protein: Fish, pantry: Droplet, dairy: Milk, packs: CookingPot }

export default function ProductTile({ product, size = 'md', className }) {
  const Icon = ICONS[product.id] ?? CATEGORY_ICON[product.category]
  return (
    <span className={clsx(styles.tile, styles[`tile_${product.category}`], styles[`tile_${size}`], className)} aria-hidden="true">
      <span className={styles.tileShape} />
      <Icon strokeWidth={1.5} />
    </span>
  )
}
