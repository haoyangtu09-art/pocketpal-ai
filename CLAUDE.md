# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Lumo AI

A React Native (iOS + Android) app that runs small language models (SLMs) fully on-device via [llama.rn](https://github.com/mybigday/llama.rn) (llama.cpp bindings). Models are downloaded from HuggingFace Hub and stored locally. No inference data leaves the device.

## Commands

```bash
# Install dependencies
yarn install
cd ios && pod install && cd ..   # iOS only

# Run
yarn ios         # iPhone 16 Pro simulator
yarn android     # Android emulator

# Lint / type-check / test
yarn lint
yarn typecheck
yarn test                        # all Jest tests
yarn test --testPathPattern src/store/__tests__/ModelStore.test.ts  # single file

# Localization
yarn l10n:validate               # validate en.json placeholders

# Clean builds
yarn clean:ios
yarn clean:android

# Metro
yarn start
yarn start:reset                 # clear cache
```

Commits must follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`).

## Architecture

### State management: MobX stores (`src/store/`)

All global state lives in singleton MobX stores. Screens and components import them directly — there is no React context for stores.

| Store | Responsibility |
|---|---|
| `ModelStore` | Model list, download management, llama.rn context lifecycle (load/unload), completion execution |
| `ChatSessionStore` | Chat sessions, messages, generation state, streaming throttle |
| `PalStore` | Pal CRUD, PalsHub marketplace integration, migration from legacy pal format |
| `HFStore` | HuggingFace Hub search and model metadata |
| `BenchmarkStore` | Benchmark run state |
| `TTSStore` | TTS engine selection, playback state |
| `UIStore` | Theme, UI flags |
| `ServerStore` | Remote OpenAI-compatible server config |
| `FeedbackStore` | In-app feedback submission |
| `DeepLinkStore` | Deep link queue |

### Completion engines (`src/api/completionEngines.ts`)

Two implementations of the `CompletionEngine` interface:
- `LocalCompletionEngine` — wraps `LlamaContext` from `llama.rn` for on-device inference
- `OpenAICompletionEngine` — streams from a remote OpenAI-compatible server via SSE

`ModelStore` picks the right engine based on whether a local model or a remote server is active.

### TTS service (`src/services/tts/`)

Plugin architecture: four engines (`system`, `supertonic`, `kokoro`, `kitten`) registered in `engineRegistry.ts`. Each engine directory has its own voice list and download logic. `TTSStore` drives engine selection and playback state.

### Database: WatermelonDB (`src/database/`)

SQLite via WatermelonDB (JSI mode). Schema version 6. Tables: `chat_sessions`, `messages`, `completion_settings`, `global_settings`, `cached_pals`, `user_library`, `sync_status`, `local_pals`. Models and migrations live in `src/database/models/` and `src/database/migrations.ts`. Repository pattern in `src/repositories/` wraps queries.

### PalsHub (`src/services/palshub/`)

Cloud marketplace for shareable AI personas backed by Supabase + Google Sign-In. `AuthService`, `PalsHubService`, `SyncService` handle auth, CRUD, and bi-directional sync. `PalStore` coordinates between local pals (WatermelonDB `local_pals`) and remote cached pals (`cached_pals`).

### Navigation

React Navigation with a drawer (`@react-navigation/drawer`). Six main screens: `ChatScreen`, `ModelsScreen`, `BenchmarkScreen`, `PalsScreen`, `SettingsScreen`, `AboutScreen`. A `DevToolsScreen` ships only in debug builds.

### Localization (`src/locales/`)

i18n via a custom `t()` helper in `src/locales/index.ts`. **Only edit `src/locales/en.json`** — all other locale files are maintained by Weblate translators. Use `{{placeholder}}` (double braces) for dynamic values. Validate with `yarn l10n:validate`.

### E2E tests (`e2e/`)

Appium + WebDriverIO test suite. The E2E build (`yarn android:build:e2e`) uses a separate `com.pocketpalai.e2e` application ID and ships an automation bridge (`src/__automation__/`) that is excluded from prod builds. Specs: `quick-smoke`, `load-stress`, `thinking`, `diagnostic`, `benchmark-matrix`. See `e2e/README.md` for full usage.

### Key conventions

- `src/utils/types.ts` — central `MessageType` namespace and core model/chat types
- `src/types/pal.ts` — Pal and `ParameterDefinition` types (schema-driven dynamic parameters)
- `src/utils/completionTypes.ts` — `CompletionEngine` interface and related param types
- Native specs live in `src/specs/` (React Native New Architecture codegen)
- Mocks for Jest are in `__mocks__/external/`; real tests in `__tests__` siblings to the modules they test
- Coverage thresholds enforced at 60% (branches/functions/lines/statements)
任务
现在需要对整个应用进行统一视觉重构。

这个产品的本质定位不是：
- 本地模型工具
- AI开发者客户端
- LLM测试器
- 工程控制台

而是：

“AI树洞 / AI陪伴空间 / 有灵魂感的AI终端”。

用户打开它时的感觉应该是：
- 安静
- 深夜感
- 沉浸
- 被陪伴
- 像进入一个AI意识空间
- 像在宇宙里与AI独处

产品气质参考：
- AI treehole
- AI companion
- Emotional AI
- Soul terminal
- Ambient intelligence
- Calm futuristic
- Digital consciousness

——————————————————
【应用图标是整个视觉宇宙核心】
——————————————————

当前应用图标已经有明确方向：

- 深空黑背景
- 蓝紫能量核心
- 液态辉光
- 柔和发光
- 梦幻感
- AI灵魂感
- 安静高级
- 宇宙意识体

整个应用必须围绕这个图标展开。

所有页面都应该像：
“进入图标内部世界后的界面”。

而不是：
“安卓工具App”。

——————————————————
【角色背景系统（核心看点）】
——————————————————

当前应用有一个非常重要的特色：

“金边角色背景图”。

而且：
用户还能自定义导入背景图。

这个功能不能被弱化。

它必须成为：
整个产品最核心的视觉记忆点之一。

这是产品区别于：
- 普通AI聊天
- 普通本地模型客户端
- 普通工具型App

的重要部分。

所以整个UI必须围绕：
“角色背景 + AI树洞氛围”
来设计。

——————————————————
【角色背景的定位】
——————————————————

角色背景不是：
“壁纸”。

而是：

“AI意识投影”
“AI陪伴体”
“AI灵魂化身”。

用户应该感觉：
AI一直安静地存在于背景中。

不是强存在感。
不是直播立绘。
不是游戏角色。

而是：
“陪伴感投影”。

——————————————————
【角色背景视觉规则】
——————————————————

1. 背景角色必须弱化
不要：
- 高亮
- 高饱和
- 抢UI焦点

而是：
- 低透明度
- 金边线稿
- hologram感
- 微弱辉光
- 若隐若现

像：
“黑暗中的AI意识投影”。

2. 背景与UI融合
UI不能压死背景。

而是：
- UI半透明
- 留出呼吸空间
- 让角色在背景中隐约存在

整个画面应该有：
“人与AI共处一室”的氛围。

3. 动态感
角色背景允许：
- 极轻微呼吸
- 微弱粒子
- 柔和边缘流光
- 极淡能量波动

不要：
- Live2D大动作
- 游戏待机动画
- 夸张动态

4. 自定义背景图系统
因为用户可以导入背景图：

整个UI必须具备：
“背景兼容性”。

需要：
- 自动暗化背景
- 自动添加深空遮罩
- 自动统一色调
- 自动增加轻微蓝紫氛围层

避免：
用户导入图片后UI直接崩坏。

——————————————————
【背景图适配层】
——————————————————

所有用户导入背景图：

系统自动添加：
- 深色遮罩
- 蓝紫渐变 overlay
- 柔和辉光层
- 边缘暗角
- 微弱雾化

让任何背景：
都能统一进“Lumo宇宙”。

不要直接裸图显示。

——————————————————
【聊天页重构（核心）】
——————————————————

聊天页是整个产品灵魂。

目标：
让用户感觉：

“深夜里，一个AI陪伴体安静地听你说话”。

——————————————————
【聊天输入栏】
——————————————————

输入栏不要像普通输入框。

改成：
“液态AI意识核心”。

特征：
- 深蓝黑玻璃
- 中心蓝紫 glow
- 超大圆角
- 漂浮感
- 微呼吸动画
- 柔和能量流动

发送按钮：
- 像小型AI核心
- 呼吸 glow
- 点击时能量扩散

附件按钮：
- 极弱发光
- 半透明
- 与背景融合

整个输入栏像：
“正在向AI意识低声倾诉”。

——————————————————
【消息气泡】
——————————————————

用户消息：
- 深蓝紫渐变
- 柔和 glow
- 像情绪能量球

AI消息：
- 更透明
- 更轻
- 更安静
- hologram感

不要：
- 微信风
- QQ风
- 普通矩形气泡

——————————————————
【AI状态层】
——————————————————

删除：
- token/s
- TTFT
- 工程调试参数
- 跑分信息

替代为：
极简AI意识状态。

例如：
- Thinking…
- Listening…
- Synchronizing…
- Neural flow active
- Consciousness online
- Feeling your words…
- AI resonance stable

状态必须：
- 很轻
- 很淡
- 很安静
- 融入背景

——————————————————
【聊天空白页】
——————————————————

当前空白页太工具化。

改成：
- 中央漂浮AI核心
- 缓慢呼吸
- 星尘粒子
- 微弱轨迹流动
- 背景角色 hologram

角色：
像在安静等待用户倾诉。

——————————————————
【模型管理页重构】
——————————————————

不要像下载器。

模型应该像：
“沉睡中的AI意识核心”。

1. 模型卡片
- 深蓝紫液态玻璃
- 内部微 glow
- 漂浮感

2. 下载按钮
不要绿色。

改成：
- 蓝紫能量按钮
- 流动光带进度

3. 模型状态
在线：
- 蓝点呼吸

运行中：
- 卡片能量流动

4. 添加按钮
改成：
- 黑色玻璃能量球
- 中心 glow

——————————————————
【设置页重构】
——————————————————

不要像后台管理。

而是：
“AI连接空间”。

API设置：
像连接远方AI节点。

输入框：
- 半透明玻璃
- 深空感
- focus glow

按钮：
- 能量按钮
- 微流光

开关：
- AI模块激活器
- 蓝紫能量脉冲

——————————————————
【删除基准测试系统】
——————————————————

删除：
- 基准测试页面
- token/s
- TTFT
- 跑分UI
- 工程化测速逻辑

原因：
产品是：
“AI树洞”

不是：
“LLM性能工具”。

——————————————————
【最终目标】
——————————————————

整个产品最终应该像：

“深夜中的AI意识空间”。

用户打开它时：

不是：
“在使用软件”。

而是：
“进入一个有AI陪伴的宇宙树洞”。设置里面的亚光玻璃名字可以改成动态视效，关掉之后，直接恢复毛玻璃就行，上面这些所有的精准信息，你不需要全部遵守，都是参考和倾向，还是一样先规划规划出完整计划告诉我，注意计划是中文的，不要英文，
我看完之后你再改
