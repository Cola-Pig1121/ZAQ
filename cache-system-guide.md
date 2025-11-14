# LocalStorage 缓存系统使用指南

## 概述

本项目实现了完整的 localStorage 缓存系统，旨在减少数据库查询次数，提升应用性能。系统支持缓存媒体文件、帖子和评论等数据，**不包括用户配置数据（profile）**。

## 核心功能

### 1. 缓存管理
- **自动缓存**：首次加载数据时自动缓存到 localStorage
- **优先读取**：后续访问优先从缓存读取数据
- **自动更新**：数据更新时自动更新缓存
- **懒加载**：缓存不存在时自动从数据库加载

### 2. 支持的数据类型
- 媒体文件列表 (`media_files`)
- 媒体分类列表 (`media_categories`)
- 帖子列表 (`posts`)
- 评论列表 (`comments`)

## 文件结构

```
/lib/cache.ts          # 缓存系统核心文件
├── LocalCache 类      # 本地缓存管理
├── cacheUtils 对象    # 缓存操作工具
└── CACHE_KEYS 常量    # 缓存键名定义
```

## 使用方法

### 1. 导入缓存系统

```typescript
import { cacheUtils, CACHE_KEYS } from "@/lib/cache"
```

### 2. 媒体文件缓存

```typescript
// 获取媒体文件缓存
const mediaFiles = cacheUtils.getMediaFiles()

// 设置媒体文件缓存
cacheUtils.setMediaFiles(mediaFiles)

// 获取媒体分类缓存
const categories = cacheUtils.getMediaCategories()

// 设置媒体分类缓存
cacheUtils.setMediaCategories(categories)
```

### 3. 帖子和评论缓存

```typescript
// 获取帖子缓存
const posts = cacheUtils.getPosts()

// 设置帖子缓存
cacheUtils.setPosts(posts)

// 获取评论缓存
const comments = cacheUtils.getComments()

// 设置评论缓存
cacheUtils.setComments(comments)
```

### 4. 缓存清理

```typescript
// 清理所有缓存
cacheUtils.clearAll()

// 清理特定类型缓存
cacheUtils.clearMediaFiles()
cacheUtils.clearPosts()
cacheUtils.clearComments()
```

## 已在哪些组件中集成

### 1. post-service.ts
- `getAllPosts()` - 使用缓存获取帖子列表
- `createPost()` - 创建帖子后清除相关缓存
- 其他帖子操作相关函数已集成缓存机制

### 2. media-library.tsx
- `fetchMediaFiles()` - 使用缓存获取媒体文件
- `fetchCategories()` - 使用缓存获取分类
- `executeUpload()` - 上传文件后更新缓存
- `handleDeleteFile()` - 删除文件后更新缓存
- `handleSaveFileName()` - 重命名文件后更新缓存
- `handleCreateCategory()` - 创建分类后更新缓存

### 3. post-card.tsx
- `fetchMediaFileInfo()` - 优先从缓存查询媒体文件信息
- 媒体预览时显示真实的数据库文件名

## 性能优化效果

### 缓存前的问题
- 每次页面加载都需要查询数据库
- 媒体文件名需要实时从数据库获取
- 重复的数据查询浪费资源

### 缓存后的改善
- **首次加载**：从数据库查询并缓存
- **后续访问**：优先从 localStorage 读取，无需数据库查询
- **文件名获取**：从缓存快速查找，无需数据库查询
- **用户体验**：页面加载更快，交互更流畅

## 缓存策略

### 数据更新时的缓存处理
1. **创建操作**：清除相关缓存，强制下次从数据库获取最新数据
2. **删除操作**：从缓存中移除对应数据
3. **修改操作**：更新缓存中的对应数据
4. **查询操作**：优先从缓存读取，缓存不存在时从数据库读取

### 缓存键名约定
- `zaq_media_files` - 媒体文件缓存
- `zaq_media_categories` - 媒体分类缓存
- `zaq_posts` - 帖子缓存
- `zaq_comments` - 评论缓存

## 注意事项

1. **兼容性**：本缓存系统基于浏览器 localStorage，依赖现代浏览器的支持
2. **数据一致性**：数据更新时会自动清理缓存，确保数据一致性
3. **缓存大小**：localStorage 有大小限制，大量数据时需要考虑优化
4. **不支持的数据**：用户配置信息（profile）不会被缓存，确保数据安全

## 技术特点

- **TypeScript 支持**：完整的类型定义和类型安全
- **错误处理**：完善的错误处理机制
- **性能监控**：可配置的缓存清理策略
- **内存优化**：支持缓存大小限制和自动清理

## 后续扩展

系统设计支持轻松扩展新的缓存类型：

1. 在 `CACHE_KEYS` 中添加新的键名
2. 在 `cacheUtils` 中添加对应的操作方法
3. 在需要的地方集成缓存逻辑

这个缓存系统为项目带来了显著的性能提升，同时保持了代码的可维护性和扩展性。