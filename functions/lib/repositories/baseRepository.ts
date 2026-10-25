// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE BASE REPOSITORY ABSTRACTION
// ============================================================

import { IBaseRepository } from "../../../src/types/backend-architecture";
import { Env } from "../contentEngine";

export abstract class BaseRepository<T extends { id: string }> implements IBaseRepository<T> {
  protected env: Env;
  protected tableName: string;
  protected repositoryName: string;

  constructor(env: Env, tableName: string, repositoryName: string) {
    this.env = env;
    this.tableName = tableName;
    this.repositoryName = repositoryName;
  }

  /** Wraps SQL execution with performance timing telemetry */
  protected async executeQuery<R>(
    operationName: string,
    queryFn: () => Promise<R>
  ): Promise<R> {
    const startTime = performance.now();
    try {
      const result = await queryFn();
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      
      // Log query execution telemetry silently
      if (executionTimeMs > 50.0) {
        console.warn(`[BaseRepository:${this.repositoryName}] Slow Query (${executionTimeMs}ms) in ${operationName}`);
      }
      return result;
    } catch (error) {
      console.error(`[BaseRepository:${this.repositoryName}] Query Failure in ${operationName}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<T | null> {
    return this.executeQuery(`findById(${id})`, async () => {
      const row = await this.env.DB.prepare(
        `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`
      )
        .bind(id)
        .first<T>();

      return row || null;
    });
  }

  async findAll(
    conditions: Record<string, unknown> = {},
    limit = 50,
    offset = 0
  ): Promise<T[]> {
    return this.executeQuery("findAll", async () => {
      const keys = Object.keys(conditions).filter((k) => conditions[k] !== undefined);
      let sql = `SELECT * FROM ${this.tableName}`;

      if (keys.length > 0) {
        const whereClause = keys.map((k) => `${k} = ?`).join(" AND ");
        sql += ` WHERE ${whereClause}`;
      }

      sql += ` LIMIT ? OFFSET ?`;
      const values = [...keys.map((k) => conditions[k]), limit, offset];

      const { results } = await this.env.DB.prepare(sql)
        .bind(...values)
        .all<T>();

      return results || [];
    });
  }

  async create(entity: Partial<T>): Promise<T> {
    return this.executeQuery("create", async () => {
      const keys = Object.keys(entity).filter((k) => (entity as any)[k] !== undefined);
      const placeholders = keys.map(() => "?").join(", ");
      const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;
      const values = keys.map((k) => (entity as any)[k]);

      await this.env.DB.prepare(sql)
        .bind(...values)
        .run();

      return entity as T;
    });
  }

  async update(id: string, updates: Partial<T>): Promise<boolean> {
    return this.executeQuery(`update(${id})`, async () => {
      const keys = Object.keys(updates).filter((k) => k !== "id" && (updates as any)[k] !== undefined);
      if (keys.length === 0) return true;

      const setClause = keys.map((k) => `${k} = ?`).join(", ");
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      const values = [...keys.map((k) => (updates as any)[k]), id];

      await this.env.DB.prepare(sql)
        .bind(...values)
        .run();

      return true;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.executeQuery(`delete(${id})`, async () => {
      await this.env.DB.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
        .bind(id)
        .run();

      return true;
    });
  }
}
