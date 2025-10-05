import {
  pgTable,
  text,
  timestamp,
  numeric,
  uuid,
  date,
  time,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
});

export const experiments = pgTable("experiments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  ph: numeric("ph"),
  tds: numeric("tds"),
  turbidity: numeric("turbidity"),
  summary: text("summary"),
  solution: text("solution"),
});

export const experimentsBank = pgTable("experiments_bank", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("Date"),
  time: time("Time"),
  longitude: numeric("Longitude"),
  latitude: numeric("Latitude"),
  turbidity: numeric("Turbidity"),
  tds: numeric("TDS"),
  ph: numeric("pH"),
});
