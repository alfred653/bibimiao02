import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── 用户表 ───
export const users = pgTable('users', {
  id:             text('id').primaryKey(),                    // Clerk user ID (user_xxx)
  email:          text('email').unique(),
  name:           text('name'),
  avatarUrl:      text('avatar_url'),
  role:           text('role').default('user'),               // 'user' | 'admin'
  membershipTier: text('membership_tier').default('free'),    // 'free' | 'monthly' | 'annual'
  status:         text('status').default('active'),           // 'active' | 'disabled'
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── 用户品牌权限表 ───
// 免费用户：无记录 → 全品牌，每个品牌最多 10 条
// 付费用户：有记录 → 配置品牌不限量；无记录的品牌最多 30 条
export const userPermissions = pgTable('user_permissions', {
  id:      integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId:  text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  brand:   text('brand').notNull(),
}, (table) => ({
  unique: uniqueIndex('up_user_brand_idx').on(table.userId, table.brand),
}));

// ─── 商品表 ───
export const products = pgTable('products', {
  id:            integer('id').primaryKey().generatedByDefaultAsIdentity(),
  title:         text('title').notNull(),
  brand:         text('brand').notNull(),
  category:      text('category'),
  spec:          text('spec'),
  price:         numeric('price', { precision: 12, scale: 2 }),
  originalPrice: numeric('original_price', { precision: 12, scale: 2 }),
  currency:      text('currency').default('CNY'),
  source:        text('source'),
  sourceUrl:     text('source_url'),
  imageUrl:      text('image_url'),
  country:       text('country'),
  tags:          text('tags').array(),
  status:        text('status').default('active'),           // 'active' | 'inactive'
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  brandIdx:       index('products_brand_idx').on(table.brand),
  statusIdx:      index('products_status_idx').on(table.status),
  titleSearchIdx: index('products_title_search_idx').on(table.title),
}));

// ─── 收藏表 ───
export const favorites = pgTable('favorites', {
  id:        integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId:    text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unique:   uniqueIndex('fav_user_product_idx').on(table.userId, table.productId),
  userIdx:  index('fav_user_idx').on(table.userId),
}));

// ─── 浏览历史表 ───
export const browseHistory = pgTable('browse_history', {
  id:        integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId:    text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  viewedAt:  timestamp('viewed_at', { withTimezone: true }).defaultNow(),
});

// ─── 搜索历史表 ───
export const searchHistory = pgTable('search_history', {
  id:         integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId:     text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  keyword:    text('keyword').notNull(),
  searchedAt: timestamp('searched_at', { withTimezone: true }).defaultNow(),
});

// ─── 快递运费表 ───
export const shippingCarriers = pgTable('shipping_carriers', {
  id:               integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name:             text('name').notNull(),
  firstWeight:      numeric('first_weight', { precision: 6, scale: 2 }).notNull().default('1.0'),
  firstCost:        numeric('first_cost', { precision: 8, scale: 2 }).notNull().default('23'),
  additionalWeight: numeric('additional_weight', { precision: 6, scale: 2 }).notNull().default('0.5'),
  additionalCost:   numeric('additional_cost', { precision: 8, scale: 2 }).notNull().default('5'),
  volumeDivisor:    integer('volume_divisor').notNull().default(6000),
  isActive:         text('is_active').default('active'), // 'active' | 'inactive'
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
