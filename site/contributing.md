# Contributing Guide

## Welcome!

Thank you for considering contributing to CS2Inspect! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Documentation](#documentation)
- [Testing](#testing)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment, discrimination, or personal attacks
- Trolling, insulting comments, or political attacks
- Publishing private information without permission
- Unprofessional conduct

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Development Environment**: Node.js 20+, Bun (recommended) or npm, MariaDB, Git
2. **GitHub Account**: For submitting pull requests
3. **Local Setup**: Follow the [Setup Guide](setup.md)

### First Time Contributors

If you're new to the project:

1. **Read the Documentation**:
   - [Architecture](architecture.md)
   - [Components](components.md)
   - [How It Works](how-it-works.md)
   - [API Reference](api.md)

2. **Look for Good First Issues**:
   - Check GitHub Issues with label `good first issue`
   - These are beginner-friendly tasks

3. **Join the Community**:
   - Comment on issues you're interested in
   - Ask questions if you're unsure
   - Introduce yourself in discussions

---

## Development Workflow

### 1. Fork and Clone

::: tip Complete Setup
For complete development environment setup including database configuration and environment variables, see the [Setup Guide](../setup.md).
:::

```bash
# Fork the repository on GitHub
# Then clone your fork

git clone https://github.com/YOUR_USERNAME/cs2inspect-web.git
cd cs2inspect-web

# Add upstream remote
git remote add upstream https://github.com/sak0a/cs2inspect-web.git
```

**Next Steps**: Follow the [Setup Guide](../setup.md) to:
- Install dependencies
- Configure the database
- Set up environment variables
- Start the development server

### 2. Create a Branch

Use descriptive branch names following this pattern:

```bash
# Feature branches
git checkout -b feature/add-weapon-preview

# Bug fix branches
git checkout -b fix/sticker-positioning-bug

# Documentation branches
git checkout -b docs/update-api-reference

# Refactoring branches
git checkout -b refactor/optimize-loadout-store
```

**Branch Naming Conventions**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Build process or dependency updates

### 3. Make Changes

Follow the code standards (see below) and make your changes:

::: tip Development Commands
For complete information on running tests, linting, and other development commands, see the [Setup Guide - Testing](../setup.md#testing) and [Setup Guide - Linting](../setup.md#linting-and-code-quality).
:::

```bash
# Make changes to files
# ...

# Run tests (using Bun - recommended)
bun test
# or using npm
npm test

# Run linter
bun run lint
# or
npm run lint

# Fix linting issues
bun run lint -- --fix
# or
npm run lint -- --fix
```

### 4. Commit Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "Add weapon preview feature

- Implement 3D weapon preview component
- Add rotation controls
- Support for all weapon types
- Include unit tests"
```

**Commit Message Format**:
```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or dependency updates

**Example**:
```
feat: Add sticker wear slider

Implement a slider component for adjusting sticker wear value.
Supports values from 0.0 (pristine) to 1.0 (fully scratched).

Closes #123
```

### 5. Push to GitHub

```bash
git push origin feature/add-weapon-preview
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template (see below)
4. Submit the pull request

---

## Code Standards

### TypeScript

#### Style Guide

```typescript
// ✅ GOOD: Use TypeScript interfaces for types
interface WeaponConfig {
  defindex: number
  paintindex: number
  paintwear: number
}

// ❌ AVOID: Using 'any' type
function processWeapon(weapon: any) { }

// ✅ GOOD: Properly typed
function processWeapon(weapon: WeaponConfig) { }

// ✅ GOOD: Use const for immutable values
const MAX_FLOAT = 1.0

// ✅ GOOD: Use descriptive variable names
const weaponDefindex = 7

// ❌ AVOID: Single letter or unclear names
const w = 7
```

#### Import Organization

```typescript
// 1. Vue/Nuxt imports
import { ref, computed } from 'vue'
import { defineEventHandler } from 'h3'

// 2. External libraries
import { useMessage } from 'naive-ui'

// 3. Internal types
import type { WeaponConfiguration } from '~/types'

// 4. Components
import WeaponSkinModal from '~/components/WeaponSkinModal.vue'

// 5. Utils and composables
import { useInspectItem } from '~/composables/useInspectItem'
```

#### Type Imports

```typescript
// ✅ GOOD: Import types from main index
import type { WeaponConfiguration, APIWeaponSkin } from '~/types'

// ❌ AVOID: Direct module imports
import type { WeaponConfiguration } from '~/types/business/items'
```

### Vue Components

#### Component Structure

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'
import type { PropType } from 'vue'

// 2. Props interface
interface Props {
  weapon: WeaponData
  show?: boolean
}

// 3. Props definition
const props = withDefaults(defineProps<Props>(), {
  show: false
})

// 4. Emits
const emit = defineEmits<{
  (e: 'save', weapon: WeaponData): void
  (e: 'close'): void
}>()

// 5. State
const selectedSkin = ref<number | null>(null)

// 6. Computed
const isValid = computed(() => selectedSkin.value !== null)

// 7. Methods
const handleSave = () => {
  if (!isValid.value) return
  emit('save', { ...props.weapon, paintindex: selectedSkin.value })
}

// 8. Lifecycle hooks
onMounted(() => {
  // Initialize
})
</script>

<template>
  <div class="weapon-modal">
    <!-- Template content -->
  </div>
</template>

<style scoped>
/* Component-specific styles */
.weapon-modal {
  /* ... */
}
</style>
```

#### Template Conventions

```vue
<template>
  <!-- ✅ GOOD: Use semantic HTML -->
  <section class="weapon-list">
    <header>
      <h2>Weapons</h2>
    </header>
    <article v-for="weapon in weapons" :key="weapon.id">
      <!-- Weapon card -->
    </article>
  </section>
  
  <!-- ✅ GOOD: Use v-show for frequent toggles -->
  <div v-show="isVisible">Content</div>
  
  <!-- ✅ GOOD: Use v-if for conditional rendering -->
  <div v-if="hasData">Data content</div>
  <div v-else>No data</div>
  
  <!-- ✅ GOOD: Proper event binding -->
  <button @click="handleClick">Click me</button>
  
  <!-- ❌ AVOID: Inline complex logic -->
  <button @click="condition ? doThis() : doThat()">Bad</button>
  
  <!-- ✅ GOOD: Extract to method -->
  <button @click="handleAction">Good</button>
</template>
```

### CSS/Styling

#### Tailwind CSS

```vue
<template>
  <!-- ✅ GOOD: Logical grouping of classes -->
  <div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
    
  <!-- ✅ GOOD: Use custom CSS variables -->
  <div class="ring-2 ring-[var(--selection-ring)]">
    
  <!-- ✅ GOOD: Responsive design -->
  <div class="w-full md:w-1/2 lg:w-1/3">
    
  <!-- ❌ AVOID: Excessive inline classes -->
  <div class="w-full h-full flex items-center justify-center p-4 m-2 bg-gray-800 text-white font-bold text-xl rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
</template>
```

#### Custom Styles

```scss
// ✅ GOOD: Use SASS features
.weapon-card {
  @apply bg-gray-800 rounded-lg p-4;
  
  &:hover {
    @apply shadow-lg;
  }
  
  .weapon-name {
    @apply text-xl font-bold;
  }
}

// ✅ GOOD: Use CSS variables
.theme-accent {
  color: var(--selection-ring);
  border-color: var(--selection-ring);
}
```

### API/Backend

#### Route Handlers

```typescript
// server/api/weapons/save.ts
import { defineEventHandler, readBody } from 'h3'
import type { WeaponSaveRequest } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    // 1. Validate authentication
    const user = await requireAuth(event)
    
    // 2. Parse and validate request body
    const body = await readBody<WeaponSaveRequest>(event)
    if (!body.weaponDefindex) {
      throw createError({
        statusCode: 400,
        message: 'Invalid weapon data'
      })
    }
    
    // 3. Perform business logic
    const result = await saveWeaponToDatabase(user.steamId, body)
    
    // 4. Return standardized response
    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    // 5. Handle errors consistently
    console.error('Error saving weapon:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to save weapon'
    })
  }
})
```

---

## Pull Request Process

### PR Checklist

Before submitting a pull request, ensure:

- [ ] Code follows the project's style guide
- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with `main`
- [ ] No merge conflicts
- [ ] Screenshots included for UI changes

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Code refactoring

## Related Issue
Closes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe how you tested your changes:
- Unit tests added/updated
- Manual testing performed
- Edge cases considered

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review code
3. **Feedback**: Address review comments
4. **Approval**: At least one maintainer approval required
5. **Merge**: Maintainer merges the PR

---

## Issue Guidelines

### Creating Issues

#### Bug Reports

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome 120]
- OS: [e.g. Windows 11]
- Version: [e.g. 1.0.0]

**Additional context**
Any other relevant information.
```

#### Feature Requests

```markdown
**Is your feature request related to a problem?**
Description of the problem.

**Describe the solution you'd like**
Clear description of desired functionality.

**Describe alternatives you've considered**
Alternative solutions or features.

**Additional context**
Any other relevant information, mockups, or examples.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested
- `wontfix` - This will not be worked on

---

## Documentation

### When to Update Docs

Update documentation when:
- Adding new features
- Changing existing functionality
- Fixing significant bugs
- Improving setup or deployment process
- Adding new API endpoints

### Documentation Standards

```markdown
# Clear Title

## Section Headers

Use descriptive headers that explain the content.

### Code Examples

Provide clear, working code examples:

\`\`\`typescript
// Example code with comments
const example = doSomething()
\`\`\`

### Lists

- Use bullet points for unordered lists
- Keep items concise
- Be consistent with punctuation

1. Use numbered lists for sequential steps
2. Ensure steps are clear and complete
3. Test that steps actually work

### Links

Link to related documentation:
- [Related Doc](related.md)
- [External Resource](https://example.com)
```

---

## Internationalization

We welcome contributions for **translations**! CS2Inspect currently supports:
- **English (EN)** - Complete
- **German (DE)** - Complete
- **Russian (RU)** - Complete

### Adding a New Language

To add a new language translation:

1. **Create Language File**:
   - Navigate to `locales/` directory in the project root
   - Copy `en.json` as a template
   - Name it with the appropriate language code (e.g., `fr.json` for French, `es.json` for Spanish)

2. **Translate Strings**:
   ```json
   {
     "nav": {
       "home": "Accueil",        // French translation
       "weapons": "Armes",
       "loadouts": "Équipements"
     }
   }
   ```

3. **Test Your Translation**:
   - Change the app language in settings to your new language
   - Navigate through all pages to verify translations
   - Check for missing strings or formatting issues

4. **Update Configuration**:
   - Edit `nuxt.config.ts` to add your language to the `i18n` config
   - Add your language code to the available locales array

5. **Submit Pull Request**:
   - Include all translated strings
   - Note any strings that were intentionally not translated (e.g., proper nouns)
   - Test that the language switcher includes your new language

### Translation Guidelines

- **Be Consistent**: Use the same terminology throughout
- **Keep It Natural**: Translate meaning, not just words literally
- **Preserve Formatting**: Keep placeholders like `{count}` or `{name}` intact
- **Technical Terms**: Some CS2-specific terms might be better left in English
- **Test In-Context**: See how translations look in the UI (character limits, line breaks)

### Translation Priority

High priority strings (translate first):
1. Navigation and menu items
2. Common actions (Save, Delete, Cancel, etc.)
3. Form labels and validation messages
4. Error messages

Lower priority:
1. Detailed help text
2. Technical documentation within the app
3. Long descriptive text

---

## Testing

### Writing Tests

#### Component Tests

```typescript
// components/WeaponTabs.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WeaponTabs from './WeaponTabs.vue'

describe('WeaponTabs', () => {
  it('renders weapon categories', () => {
    const wrapper = mount(WeaponTabs)
    expect(wrapper.find('.weapon-category').exists()).toBe(true)
  })
  
  it('emits selection event when weapon clicked', async () => {
    const wrapper = mount(WeaponTabs)
    await wrapper.find('.weapon-item').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
  })
})
```

#### API Tests

```typescript
// server/api/weapons/save.spec.ts
import { describe, it, expect } from 'vitest'
import { createEvent } from '@nuxt/test-utils'

describe('POST /api/weapons/save', () => {
  it('saves weapon successfully', async () => {
    const event = createEvent({
      method: 'POST',
      body: {
        weaponDefindex: 7,
        paintindex: 253
      }
    })
    
    const response = await handler(event)
    expect(response.success).toBe(true)
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test components/WeaponTabs.spec.ts
```

---

## Questions?

- **Documentation**: Check the [docs/](.) directory
- **Issues**: Search existing GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers (if provided)

---

## License

By contributing to CS2Inspect, you agree that your contributions will be licensed under the project's license.

---

## Thank You!

Thank you for contributing to CS2Inspect! Your time and effort help make this project better for everyone.

---

## Related Documentation

- [Setup Guide](setup.md) - Development environment setup
- [Architecture](architecture.md) - System architecture
- [Components](components.md) - Component documentation
- [API Reference](api.md) - API documentation
