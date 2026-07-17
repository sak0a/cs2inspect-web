# Default shadcn controls design

## Context

The Tailwind CSS v4 and shadcn-vue migration introduced the shadcn primitives, but the shared `Button` retained the deleted SUI button system. Its current CVA contains custom glass and elevated gradients, inset shadows, pill-shaped defaults, bespoke semantic intents, and legacy size and radius controls. Dropdown consumers also add repeated glass, blur, large-shadow, and rounded-item classes on top of the shadcn primitives.

This produces the shaded control appearance that this change removes.

## Decision

All shared controls will use the current shadcn-vue New York v4 component recipes. CS2Inspect will keep its dark theme and yellow `primary` token, because shadcn's CSS-variable model supports branded tokens without changing component recipes.

Custom styling remains allowed for domain-specific presentation: skin cards, weapon and item tiles, inspect visuals, specialized selectors, and modal compositions. The exception is based on purpose, not location. A normal action button inside a custom modal still uses the shared shadcn Button.

Reference: <https://shadcn-vue.com/r/styles/new-york-v4/button.json>

## Considered approaches

### 1. Strict shadcn shared controls — selected

Restore registry-default Button, dropdown surface, menu item, and submenu recipes everywhere. Preserve custom domain visuals.

This creates one understandable control language, removes the legacy SUI styling API, and prevents new consumers from accidentally reintroducing the shaded appearance.

### 2. Default buttons with custom dropdown surfaces

Reset buttons and dropdown triggers but retain the current glass dropdown panels and rounded menu items.

This would remove the most visible shaded buttons but leave two visual systems in the same interaction and repeated styling overrides at call sites.

### 3. Selective shade removal

Replace only the worst `elevated` usages and retain the compatibility Button API.

This would minimize the diff but preserve the underlying source of inconsistency and make the meaning of each legacy variant less predictable.

## Component design

### Button primitive

`app/components/ui/button/index.ts` will use the registry-default New York v4 CVA:

- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, and `link`.
- Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, and `icon-lg`.
- Default radius, focus ring, disabled state, icon sizing, and hover behavior will match the registry recipe.

The following legacy style API will be removed:

- Variants: `filled`, `light`, `outlined`, `dashed`, `glass`, and `elevated`.
- Props: `intent`, `rounded`, `iconOnly`, `tinted`, and `block`.
- Custom gradients, brightness effects, active scaling, translucent fills, pill defaults, borders, and inset or elevated shadows.

The Button may retain the existing loading behavior as an app-specific functional extension. Loading must use the Button's normal disabled state and default icon sizing; it must not add a visual variant. Native button type handling may also remain because it does not alter styling.

### Usage migration

Call sites will move to shadcn vocabulary according to hierarchy rather than receive a mechanical color-for-color translation:

| Existing usage | New usage |
| --- | --- |
| `filled` primary action | `default` |
| `light` or `elevated` secondary action | `secondary` or `outline` |
| `outlined` | `outline` |
| `ghost` | `ghost` |
| `link` | `link` |
| error/destructive action | `destructive` |
| icon-only action | an `icon*` size |
| full-width action | `class="w-full"` |

Success, warning, and informational meaning will be communicated through action labels, icons, surrounding status content, and normal hierarchy. The Button will not keep bespoke green, amber, or blue intent variants.

Generic native buttons that duplicate normal actions, including error-page and retry actions, will migrate to the shared Button. Native or role-based controls whose custom shape is part of a domain interaction may remain custom, including skin and weapon tiles, item-slot controls, and specialized selectors.

### Dropdowns

Dropdown triggers that look like buttons will compose `DropdownMenuTrigger` with the shared Button via `as-child`.

Dropdown content, submenu content, items, sub-triggers, separators, and destructive items will use the registry-default primitive recipes. Consumers will remove presentation overrides such as glass backgrounds, backdrop blur, `shadow-2xl`, custom corner radii, and forced item cursor or hover styling.

Behavioral and layout props remain valid, including `side`, `align`, collision behavior, and necessary width constraints. State indicators such as a selected loadout checkmark may remain, but they must not restyle the entire menu item into a custom control recipe.

Select triggers already use the registry recipe. Consumer width constraints may remain because they are layout rather than component styling.

## Theme boundary

The existing dark theme and semantic CSS variables stay in place. In particular:

- `--primary` remains CS2Inspect yellow.
- `--primary-foreground` remains a readable dark foreground.
- Background, popover, accent, border, destructive, and ring tokens continue to define the dark product theme.

No custom button-only color variables, durations, opacity variables, gradients, or shadow recipes remain after their final consumers are removed.

## Behavior and accessibility

This change does not alter application data flow, routing, authentication, loadout operations, or backend APIs.

Existing click handlers, menu selection behavior, disabled conditions, loading conditions, and dialog close behavior will be preserved. Buttons and menu triggers must retain accessible names. Loading buttons must expose a disabled state and keep their text available to assistive technology where practical. Keyboard navigation and focus-visible behavior will come from the shadcn/reka primitives.

## Verification

Implementation is complete when:

1. The shared Button recipe matches the current shadcn-vue New York v4 styles and exposes no legacy visual variants.
2. No application call site uses removed Button props or variants.
3. Shared dropdown consumers no longer apply glass, blur, large-shadow, or custom-rounded presentation classes.
4. Generic native action buttons are migrated; documented domain-specific controls remain intentionally custom.
5. The existing yellow primary token and dark theme render correctly.
6. Linting, typechecking, focused tests, and the production build pass, apart from documented pre-existing failures.
7. Browser verification covers navigation controls, settings and loadout dropdowns, dialogs and modals, skin pages, error actions, and admin controls using dev mock authentication where authentication is required.

## Non-goals

- Redesigning skin cards, inspect visuals, weapon tiles, or modal composition.
- Changing product colors or introducing a new visual identity.
- Changing application behavior, backend APIs, or data models.
- Replacing shadcn-vue, reka-ui, Tailwind CSS v4, or Lucide.
