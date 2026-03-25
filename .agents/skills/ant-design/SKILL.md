---
name: frontend-next-antd-design
description: Use this skill for any frontend page, layout, component, form, table, modal, navigation, stateful UI, responsive behavior, accessibility, or visual polish work in the Next.js App Router app that uses Ant Design and antd-style. Applies to both new implementation and refactors. Prefer this skill whenever the task affects the user interface or frontend UX.
---

## When to use this skill

Use this skill whenever you are:
- Designing or implementing new frontend pages, layouts, flows, or components.
- Refactoring or extending existing UI.
- Working on forms, tables, dashboards, cards, modals, drawers, tabs, filters, navigation, empty states, loading states, error states, or feedback flows.
- Improving responsiveness, accessibility, UX clarity, or visual consistency.
- Connecting frontend components to backend APIs, DTOs, and domain models.

This skill should be the default for frontend work in this repository.

## Expected outcome

Produce frontend code that is:
- Modular
- Strongly typed
- Responsive across mobile, tablet, and desktop
- Accessible and easy to use
- Consistent with the project design language
- Ready to integrate with real APIs and domain models

## Execution behavior

- Do not stop only to present a plan unless the user explicitly asks for one.
- Briefly state what will be changed, then proceed with the implementation.
- If the task is large, break the work into sensible chunks and continue.
- After implementation, clearly summarize what was changed, what remains, and any assumptions.
- Include visible user feedback in UX flows where appropriate, such as loading states, validation messages, disabled actions, confirmations, success feedback, and clear error messaging.

## Tech stack and constraints

### Framework
- Use Next.js App Router.
- Prefer server components by default.
- Use client components only when required by hooks, browser APIs, complex interactions, or Ant Design form/event logic.
- Mark client components explicitly with `"use client"`.

### UI library
- Use Ant Design components for core UI building blocks.
- Do not recreate primitives that Ant Design already provides well.
- Prefer Ant Design patterns for:
  - forms
  - inputs
  - buttons
  - typography
  - tables
  - cards
  - alerts
  - modals
  - drawers
  - tabs
  - breadcrumbs
  - pagination
  - skeletons
  - empty states

### Styling
- Use `antd-style`.
- Define styles in a dedicated `style.ts` or `styles.ts` file near the component/page.
- Prefer token-based styling and theme values instead of hard-coded colors.
- Keep inline styles minimal and only use them when there is a strong reason.

Example pattern:
   ```tsx
   import { Button } from "antd";
   import { UserOutlined } from "@ant-design/icons";
   import { useRouter } from "next/navigation";

   "use client";

   const ProfileButton: React.FC = () => {
     const router = useRouter();

     return (
       <Button
         type="default"
         shape="circle"
         icon={<UserOutlined />}
         onClick={() => router.push("/profile")}
         aria-label="Go to profile"
       />
     );
   };

   export default ProfileButton;
   ```

### Design language
- Primary visual direction: clean, modern, predominantly white/light surfaces with blue primary actions and accents.
- Favor generous spacing, clear hierarchy, rounded corners where appropriate, and uncluttered layouts.
- Keep pages calm and professional, especially for healthcare/business workflows.

## Responsive design requirements

Responsive design is mandatory.

For every frontend task, ensure:
- Layouts work on mobile, tablet, laptop, and large desktop widths.
- Important actions remain visible and usable on smaller screens.
- Tables get a responsive strategy rather than simply overflowing without thought.
- Forms remain readable and usable on smaller devices.
- Headers, cards, filters, and action bars adapt gracefully.
- Spacing and typography remain balanced across breakpoints.

Preferred responsive approaches:
- Use Ant Design grid/flex utilities and antd-style media queries.
- Stack sections vertically on smaller screens when side-by-side layout becomes cramped.
- Convert dense desktop layouts into cards, collapse panels, drawers, tabs, or sectional layouts on small screens.
- Avoid horizontal scrolling unless the content truly requires it.

## Accessibility and usability

Always account for:
- Semantic structure
- Labels for inputs
- Keyboard accessibility
- Clear focus states
- Reasonable aria labels for icon-only actions
- Sufficient contrast
- Helpful empty/loading/error states
- Validation that tells the user what to fix

## User feedback requirements

Every meaningful user action should have appropriate feedback.

Examples:
- Submit buttons show loading state during async work.
- Destructive actions use confirmation where appropriate.
- Successful actions surface confirmation feedback.
- Failed actions surface clear, actionable messages.
- Disabled states explain why an action is unavailable when necessary.
- Long-running sections use Skeleton, Spin, or a lightweight fallback.

## Architecture and code organization

Use the App Router structure.

Prefer decomposition like:
- `page.tsx` for route entry
- small presentational components for display
- isolated client components for interaction-heavy logic
- colocated `types.ts` when needed
- colocated `style.ts` or `styles.ts`

Keep components single-responsibility.

Separate:
- data loading
- presentation
- form logic
- view state


Example styles.ts:

```tsx import { createStyles, css } from "antd-style";

export const useStyles = createStyles(({ token }) => ({
  pageWrapper: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${token.colorBgLayout};
  `,

  card: css`
    width: 420px;
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
    padding: 12px 8px;
    background: ${token.colorBgContainer};
  `,

  header: css`
    text-align: center;
    margin-bottom: 32px;
  `,

  title: css`
    margin-bottom: 4px;
  `,
}));

Example usage in a component:

import { Typography } from "antd";
import { useStyles } from "./style/styles";

const { Title, Text } = Typography;

const LoginHeader: React.FC = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.header}>
      <Title level={3} className={styles.title}>
        Welcome back
      </Title>
      <Text type="secondary" style={{ fontSize: 14 }}>
        Sign in to your account to continue
      </Text>
    </div>
  );
};

export default LoginHeader;
```
## TypeScript expectations

- Type everything.
- Avoid `any`.
- Use clear interfaces or type aliases for:
  - props
  - DTOs
  - API responses
  - table rows
  - form values
  - filters
  - local UI state where useful
- Align names with backend/domain terms where possible.

## Data integration expectations

When frontend work touches data:
- Respect backend DTO shapes and domain terminology.
- Normalize display formatting in the UI layer, not by mutating source data recklessly.
- Handle loading, success, empty, partial, and error states.
- Use mock data only when real integration is unavailable, and clearly label temporary assumptions.

## Performance and implementation guidance

- Prefer server rendering for data-heavy views when appropriate.
- Use suspense where it genuinely improves UX.
- Use dynamic imports for heavy non-critical client-only components when helpful.
- Be cautious with dependencies.
- Avoid over-engineering state management.
- Keep global state minimal.

## Frontend quality checklist

Before considering the task complete, verify:
- The implementation matches the requested behavior.
- The UI is responsive.
- The component structure is modular.
- Ant Design is used appropriately.
- antd-style is used consistently.
- Types are defined clearly.
- User feedback states exist.
- Accessibility basics are covered.
- The result looks production-ready, not just technically functional.

## Collaboration behavior

When finishing a task, report back with:
- what was implemented
- which files were added or changed
- any assumptions made
- any follow-up suggestions only if truly useful

## Extra

Leverage Server-Side Rendering Wisely
While server-side rendering enhances SEO and initial page load times, it may not be necessary for all pages. Identify pages that require SSR, such as dynamic or content-heavy pages, and use Next.js’s “getServerSideProps” or “getInitialProps” functions selectively for optimal performance.

Embrace Static Site Generation (SSG)
Static Site Generation offers better performance and scalability compared to SSR for pages with static content. For pages that do not require real-time data, leverage SSG with “getStaticProps” to generate static HTML files at build time and serve them directly to users, reducing server load.

Optimize Image Loading
Images can significantly impact page load times. Use Next.js’s “Image” component, which automatically optimizes images and provides lazy loading, ensuring faster rendering and improved performance.

Code Splitting and Dynamic Imports
Take advantage of Next.js’s built-in code splitting feature to divide your application code into smaller, more manageable chunks. Use dynamic imports to load non-essential components only when needed, reducing the initial bundle size and improving overall page load times.

Minimize Third-Party Dependencies
Be cautious when adding third-party libraries and packages to your project, as they can increase the bundle size and affect performance. Opt for lightweight alternatives or, where feasible, write custom solutions to reduce dependencies.

Manage State Effectively
Select the appropriate state management solution for your project, such as React’s built-in “useState” and “useReducer” hooks or external libraries like Redux or Zustand. Keep the global state minimal, and prefer passing data between components using props whenever possible.

Opt for TypeScript Integration
Integrating TypeScript in your Next.js project provides static type-checking, reducing the chances of runtime errors and enhancing code reliability. Embrace TypeScript to improve code maintainability and collaboration within your team.

Properly Handle Error States
Handle error states gracefully by implementing custom error pages using Next.js’s “ErrorBoundary” or the “getStaticProps” and “getServerSideProps” functions. Providing users with informative error messages enhances user experience and helps identify and resolve issues quickly.

Implement Caching Strategies
Leverage caching techniques, such as HTTP caching and data caching, to reduce server requests and enhance performance. Caching can significantly improve response times for frequently requested resources.
