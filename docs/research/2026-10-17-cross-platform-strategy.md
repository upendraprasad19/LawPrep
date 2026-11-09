# Web-first delivery and future mobile apps

Research date: 17 October 2026.

Status: research completed. The owner accepted the high-level React/TypeScript learner, Next.js public/server layer, shared backend and future Capacitor route on 18 October 2026. Full product design approval and the implementation plan remain separate next steps. Detailed tooling in this note remains a recommendation.

## Conclusion for Law Prep

Recommend a React/TypeScript learner application designed to produce a self-contained web bundle, a shared hosted backend, and Capacitor as the first candidate for future Android/iOS packaging. Use Next.js for public, searchable career/exam guides and other web/server functions where appropriate. Keep its request-time server dependencies outside the packageable learner interface.

This is a fit assessment for the current product: written teaching, annotated passages, questions, mocks, revision, progress and text-based AI. It is not a claim that most education companies use Capacitor or that native delivery will be automatic.

The goal is one shared learner interface with platform adapters and separate builds. One repository may contain multiple build targets, a public site and server services. That is different from maintaining three independent learning products.

## What shipped products demonstrate

### Web interface reused across delivery targets

Ionic's BBC Children's Games case study documents a PWA-based interface packaged for mobile stores with Capacitor. It establishes that this architecture has been deployed at a substantial organisation. The linked BBC engineering article dates to November 2020; treat this as a historical case, not confirmation of the BBC's complete current stack.

Sources:
- https://ionic.io/resources/case-studies/bbc-games
- https://medium.com/bbc-product-technology/shipping-progressive-web-apps-everywhere-190a421c606a

### Existing React web product followed by a native interface

Rosebud's co-founder describes evaluating Expo/React Native, Flutter, native iOS and Capacitor. It selected Expo, reusing React/TypeScript hooks, types, utilities and business logic while optimising its mobile interface. That is evidence for selective reuse rather than automatically converting arbitrary web components to native widgets. It is a company-authored experience published by a framework vendor, not an independent benchmark.

Source: https://expo.dev/blog/how-rosebud-decided-to-go-native-with-expo

### Education platform with shared services and a separate mobile client

Moodle documents a mobile codebase separate from its LMS, communicating through web services. Its app uses Angular/Ionic and Cordova. This is not evidence that Moodle uses Capacitor, or that its browser LMS and mobile app have identical interfaces. It illustrates the durable value of a shared service boundary.

Source: https://moodledev.io/general/app/overview

## Options

| Approach | Reuse model | Main trade-off | Fit for our current scope |
| --- | --- | --- | --- |
| React web learner + Capacitor | Share browser-based learner UI, types and application logic; add native projects and adapters | Native interaction, login, storage, billing and release work remains | Recommended first candidate for future mobile packaging |
| Expo / React Native + web | Write cross-platform components deliberately; share services and compatible logic | Existing HTML/CSS components do not automatically become native UI; platform-specific adaptations still exist | Strong alternative if a native mobile experience becomes the dominant requirement |
| Flutter + web | Share Dart/Flutter UI across supported targets | Existing React/TypeScript UI does not transfer; public document-style pages may merit a separate web frontend | Technically viable, but less aligned with our current web-first starting point |
| Separate native and web clients | Share content/backend and selected contracts; maintain distinct interfaces | More frontend and release work | Reserve for requirements that justify it |

Expo explicitly supports web and recommends React Native for Web when targeting multiple platforms to maximise component reuse. It also states that web-only DOM components do not render as native components. Do not claim Expo lacks web support or that the only React reuse path is Capacitor.

Source: https://docs.expo.dev/workflow/web/

Flutter's official web FAQ distinguishes application-centric interfaces from document-style, text-rich public websites. That distinction supports a web-fit decision; it does not mean Flutter cannot build a learning application.

Source: https://docs.flutter.dev/platform-integration/web/faq

## Recommended boundaries

1. Public guides/site: Next.js is appropriate for search-visible pages, content rendering and hosted web functions.
2. Learner interface: React/TypeScript with responsive browser UI; produce a standalone client bundle. A dedicated Vite build is one straightforward option. Shared UI modules may also be consumed by the public site.
3. Backend: authenticated APIs and centrally managed content, attempt evidence, scoring, deadlines, progress, subscriptions and AI calls. Server-side authorisation remains authoritative even if UI code is shipped to devices.
4. Platform adapters: isolate session persistence, login return handling, notifications, downloads and billing from lesson/test components. Native implementations are added only when native delivery is authorised.
5. Mobile shells: later Capacitor Android/iOS projects consume the learner bundle and call the same hosted services.

The exact monorepo layout/build tools belong in the implementation plan. Avoid setting up multiple independent products or introducing a complex package system before there is a clear shared boundary.

## Next.js limitation that changes the plan

Next.js static export supports built HTML/CSS/JavaScript and client-side requests. Request-time server features such as Server Actions and request-dependent handlers are not available inside that exported build; dynamic routes also have constraints. A conventional full-stack Next.js app is therefore not automatically a mobile bundle. The learner build must be designed and checked separately from hosted server behaviour.

Source: https://nextjs.org/docs/app/guides/static-exports

Capacitor expects built assets with a root index.html and copies the bundle into its platform projects. Its configuration explicitly marks the external server.url option as intended for live reload, not production. The supported plan should package learner assets and use hosted APIs, rather than treating a development URL switch as the production conversion strategy.

Sources:
- https://capacitorjs.com/docs/getting-started
- https://capacitorjs.com/docs/config

## Practices to adopt now

- Store business rules and reusable data contracts outside UI components; distinguish shared server rules from client display logic.
- Give lesson content, exam configurations and attempt snapshots stable identities and versions.
- Keep the server authoritative for access, scores and assessed-test deadlines; save answers incrementally and use idempotent completion operations.
- Plan API compatibility for older installed apps, rather than assuming all clients update with the website.
- Keep login/storage/billing integration behind platform boundaries; do not scatter browser-only assumptions throughout learning code.
- Design reliable reconnect and resume paths. Treat offline lessons and offline assessed tests as separately scoped features.
- Test readable text, passage navigation, option selection, soft keyboard behaviour, safe areas and interrupted sessions on phones.
- Keep a single internal entitlement model while allowing different purchase providers. Actual store billing must follow the rules applicable at release time.
- Evaluate performance and accessibility on ordinary devices; do not optimise for a promised code-sharing percentage.
- During web work, confirm the learner bundle builds and runs independently from server-only rendering. When native work is authorised, validate login, a lesson, a test/resume flow and AI interaction on devices before packaging the whole product.

These are design recommendations inferred from the documented boundaries and Law Prep's assessment requirements, not an assertion that every cited company uses each practice.

## Work that remains for native release

Native project configuration, device-specific behaviour, login integration, optional plugins, secure storage, purchase handling where applicable, Android/iOS signing, device testing, developer accounts and store submission still require work. iOS requires a Mac/Xcode environment locally or an appropriate cloud build setup.

Source: https://capacitorjs.com/docs/getting-started/environment-setup

Apple's minimum-functionality guidelines require adequate app utility beyond repackaging a website. Framework choice does not guarantee store acceptance. The eventual mobile product should present a deliberate learning experience with appropriate mobile interactions; no blanket claim is made that a particular native feature guarantees approval.

Source: https://developer.apple.com/app-store/review/guidelines/#minimum-functionality

## Ecosystem check

Ionic's February 2025 announcement discontinued new sales of its commercial offerings and announced wind-down arrangements, while explicitly retaining maintenance of open-source Capacitor and Ionic Framework. Do not make the future build pipeline depend on a newly purchased Ionic Appflow subscription. This is distinct from claiming that Capacitor itself is discontinued.

Source: https://ionic.io/blog/important-announcement-the-future-of-ionics-commercial-products

## What this research does not establish

- It does not identify the private technology stacks of Law Prep Tutorial, LegalEdge or Career Launcher. Public feature pages cannot establish those stacks.
- Case studies are illustrative, sometimes historical and vendor-published; they are not evidence of market-share dominance or a universal industry standard.
- No code-sharing percentage, native implementation duration or cost estimate is validated for Law Prep yet.
- No framework packages, native projects or APK/iOS builds were created during this research.
