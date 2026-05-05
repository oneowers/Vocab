# LexiFlow UI Components Guide (iOS Premium Style)

> [!TIP]
> **Live Preview**: You can see and interact with all these components live at [/ui-kit](/ui-kit). There you can also copy the code directly for each component.

This document provides an overview of the custom UI components created during the LexiFlow visual migration to a premium, native iOS aesthetic.

## 1. Core Design System
All components follow the **Apple Human Interface Guidelines (HIG)**, featuring:
- **Materials**: Heavy use of `backdrop-blur` and translucent backgrounds (`/95` opacity).
- **Geometry**: Custom "Squircle" corners using `rounded-[22%]` or large pixel values (24px-32px).
- **Animations**: Spring-based transitions using `framer-motion` (stiffness: 300-450).
- **Colors**: System Blue (`#0A84FF`), Destructive Red (`#FF453A`), and custom Dark materials (`#1C1C1E`).

---

## 2. Shared Components (`AppleDashboardComponents.tsx`)

### `AppleCard`
A versatile container for grouping content.
- **Features**: Spring animation on click, squircle corners, subtle borders.
- **Usage**:
```tsx
<AppleCard href="/stats">
  <div className="p-4">Card Content</div>
</AppleCard>
```

### `AppleListItem`
The building block for settings and profile lists.
- **Props**: `title`, `subtitle`, `icon`, `iconColor`, `rightLabel`, `href`, `onClick`.
- **Usage**:
```tsx
<AppleListItem 
  title="Sign-In & Security" 
  icon={<ShieldCheck size={18} />} 
  iconColor="bg-[#8E8E93]" 
  showDivider={true}
  onClick={() => {}}
/>
```

### `AppleHeader`
A centralized header with the signature LexiFlow gradient.
- **Features**: "Glassmorphism" effect, automatic Back button (on mobile), title centering.
- **Usage**:
```tsx
<AppleHeader title="Account Settings" />
```

### `AppleAlert`
A high-fidelity iOS 17+ alert modal for errors and confirmations.
- **Features**: Backdrop blur, pill-shaped buttons (`#3A3A3C`), scale-in animation.
- **Usage**:
```tsx
<AppleAlert 
  isOpen={true}
  onClose={() => {}}
  title="Access Denied"
  message="You need a PRO subscription for this."
/>
```

---

## 3. Brand Assets

### `BrandLogo`
A premium vector-based SVG logo replaced the old low-res images.
- **Design**: Minimalist "Flow" icon that adapts to container colors using `currentColor`.
- **Container**: Should always be wrapped in a white squircle:
```tsx
<div className="h-11 w-11 bg-white rounded-[22%] p-2">
  <BrandLogo />
</div>
```

---

## 4. Complex UI Flows

### `ProfileView` (Settings Flow)
- **Concept**: A full-screen hierarchical settings page.
- **Features**: Grouped list items, profile avatar with PRO badge, and full-screen sub-sheets for sensitive actions (like Password change).

### `LoginCard` (Auth Flow)
- **Concept**: Two-stage authentication experience.
- **Landing Stage**: High-impact branding with "Sign In" and "Create Account" triggers.
- **Sheet Stage**: A native iOS bottom-sheet containing the form inputs.

---

## Maintenance Tips
1. **Always use Lucide Icons**: Maintain consistency by using `lucide-react` with `size={18}` or `size={20}`.
2. **Dividers**: When grouping list items, use `<div className="h-[0.5px] bg-white/[0.08] ml-14" />`.
3. **Active States**: Use `active:scale-95` on all interactive elements for tactile feedback.
